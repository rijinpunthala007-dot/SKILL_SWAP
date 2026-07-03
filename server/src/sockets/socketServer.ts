import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { JwtPayload } from '../middleware/authenticate';
import { conversationService, presenceService } from '../services/conversation.service';
import { conversationRepository, messageRepository } from '../repositories/conversation.repository';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

export function setupSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // Redis adapter for horizontal scaling across multiple server instances
  const pubClient = new Redis(env.REDIS_URL, { lazyConnect: true });
  pubClient.on('error', (error) => logger.debug({ error }, 'Socket.IO Redis pubClient error'));

  const subClient = new Redis(env.REDIS_URL, { lazyConnect: true });
  subClient.on('error', (error) => logger.debug({ error }, 'Socket.IO Redis subClient error'));

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter initialized');
    })
    .catch((error) => {
      logger.warn(
        { error },
        'Socket.IO Redis adapter unavailable — running without Redis adapter (single-instance mode). Chat still works.'
      );
      // Do NOT exit — server runs fine on a single instance without the Redis adapter.
      // In production (Render), Redis will be available via REDIS_URL env var.
    });

  // ── Auth Middleware ─────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: string }).token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).userEmail = payload.email;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection Handler ──────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const s = socket as AuthenticatedSocket;
    logger.info({ userId: s.userId, socketId: s.id }, 'Socket connected');

    // Mark user online in Redis
    await presenceService.setOnline(s.userId);
    socket.broadcast.emit('user_online', { userId: s.userId });

    // ── Presence heartbeat ────────────────────────────────────────────────────
    const heartbeatInterval = setInterval(() => {
      presenceService.refreshPresence(s.userId).catch(() => {});
    }, 15000);

    // ── Join Conversation ─────────────────────────────────────────────────────
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      try {
        const isParticipant = await conversationRepository.isParticipant(
          data.conversationId,
          s.userId
        );
        if (!isParticipant) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Not a participant' });
          return;
        }
        await socket.join(`conv:${data.conversationId}`);
        logger.debug({ userId: s.userId, conversationId: data.conversationId }, 'Joined conversation room');
      } catch (error) {
        logger.error({ error, userId: s.userId }, 'Error joining conversation');
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join conversation' });
      }
    });

    // ── Send Message ──────────────────────────────────────────────────────────
    socket.on(
      'send_message',
      async (data: { conversationId: string; content: string; tempId: string }) => {
        try {
          const { conversationId, content, tempId } = data;

          if (!content?.trim()) return;

          const isParticipant = await conversationRepository.isParticipant(
            conversationId,
            s.userId
          );
          if (!isParticipant) {
            socket.emit('error', { code: 'FORBIDDEN', message: 'Not a participant' });
            return;
          }

          // Persist FIRST — the DB write is the source of truth
          const message = await conversationService.sendMessage(
            conversationId,
            s.userId,
            content.trim()
          );

          const messageData = {
            ...message.toObject(),
            tempId, // client uses this to reconcile optimistic UI
          };

          // Broadcast to all room participants (including sender for confirmation)
          io.to(`conv:${conversationId}`).emit('receive_message', messageData);

          logger.debug(
            { messageId: message._id, conversationId, userId: s.userId },
            'Message sent'
          );
        } catch (error) {
          logger.error({ error, userId: s.userId }, 'Error sending message');
          socket.emit('message_error', { tempId: data.tempId, message: 'Failed to send message' });
        }
      }
    );

    // ── Typing Indicators ─────────────────────────────────────────────────────
    socket.on('typing', (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('typing', { userId: s.userId });
    });

    socket.on('stop_typing', (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('stop_typing', { userId: s.userId });
    });

    // ── Read Receipt ──────────────────────────────────────────────────────────
    socket.on('mark_read', async (data: { conversationId: string }) => {
      try {
        await messageRepository.markRead(data.conversationId, s.userId);
        socket.to(`conv:${data.conversationId}`).emit('messages_read', {
          userId: s.userId,
          conversationId: data.conversationId,
        });
      } catch (error) {
        logger.error({ error, userId: s.userId }, 'Error marking messages as read');
      }
    });

    // ── Reconnection Backfill ─────────────────────────────────────────────────
    socket.on(
      'request_backfill',
      async (data: { conversationId: string; lastSeenMessageId: string }) => {
        try {
          const isParticipant = await conversationRepository.isParticipant(
            data.conversationId,
            s.userId
          );
          if (!isParticipant) return;

          const messages = await conversationService.getMessagesSince(
            data.conversationId,
            s.userId,
            data.lastSeenMessageId
          );

          socket.emit('backfill_messages', {
            conversationId: data.conversationId,
            messages,
          });
        } catch (error) {
          logger.error({ error, userId: s.userId }, 'Error during backfill');
        }
      }
    );

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      clearInterval(heartbeatInterval);
      logger.info({ userId: s.userId, socketId: s.id, reason }, 'Socket disconnected');

      await presenceService.setOffline(s.userId);
      socket.broadcast.emit('user_offline', { userId: s.userId });
    });
  });

  return io;
}
