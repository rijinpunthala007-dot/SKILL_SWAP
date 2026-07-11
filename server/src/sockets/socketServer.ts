import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { JwtPayload } from '../middleware/authenticate';
import { conversationService, presenceService } from '../services/conversation.service';
import { liveQuizService } from '../services/liveQuiz.service';
import { gamificationService } from '../services/gamification.service';
import { conversationRepository, messageRepository } from '../repositories/conversation.repository';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

// ── Challenge Orchestration (module-level to avoid stale closures) ──────────
function broadcastQuestion(
  io: SocketServer,
  conversationId: string
): void {
  const currentState = liveQuizService.getChallenge(conversationId);
  if (!currentState || currentState.status !== 'active') return;

  const q = currentState.questions[currentState.currentQuestionIndex];
  const qObj = typeof (q as any).toObject === 'function' ? (q as any).toObject() : { ...q };
  const { correctIndex, ...clientQ } = qObj;

  io.to(`conv:${conversationId}`).emit('challenge_question', {
    questionIndex: currentState.currentQuestionIndex,
    question: clientQ,
    scores: currentState.scores,
    totalQuestions: currentState.questions.length
  });

  const timerId = setTimeout(() => endRound(io, conversationId), 15000);
  (currentState as any).timerId = timerId;
}

function endRound(
  io: SocketServer,
  conversationId: string
): void {
  const currentState = liveQuizService.getChallenge(conversationId);
  if (!currentState || currentState.status !== 'active') return;

  // Guard: only end the round once
  if ((currentState as any).roundEnding) return;
  (currentState as any).roundEnding = true;

  if ((currentState as any).timerId) clearTimeout((currentState as any).timerId);

  const q = currentState.questions[currentState.currentQuestionIndex];
  const qObj = typeof (q as any).toObject === 'function' ? (q as any).toObject() : { ...q };

  io.to(`conv:${conversationId}`).emit('challenge_round_result', {
    correctOptionIndex: qObj.correctIndex,
    scores: currentState.scores
  });

  setTimeout(() => {
    (currentState as any).roundEnding = false;
    const hasNext = liveQuizService.nextRound(conversationId);
    if (hasNext) {
      broadcastQuestion(io, conversationId);
    } else {
      // Snapshot scores before removing
      const { challengerId, opponentId, scores, skill } = currentState;
      io.to(`conv:${conversationId}`).emit('challenge_end', { scores });
      liveQuizService.removeChallenge(conversationId);

      const myScore = scores[challengerId] ?? 0;
      const oppScore = scores[opponentId] ?? 0;
      let text = `Quiz on ${skill} ended! Score: ${myScore}-${oppScore}. `;
      let winnerId: string | null = null;
      if (myScore > oppScore) {
        text += `Winner: <@${challengerId}>`;
        winnerId = challengerId;
      } else if (oppScore > myScore) {
        text += `Winner: <@${opponentId}>`;
        winnerId = opponentId;
      } else {
        text += "It's a tie!";
      }

      if (winnerId) {
        gamificationService.awardPoints(winnerId, 'quiz_passed').catch((e) => logger.error(e));
      }

      // Use challengerId as message sender (always a valid participant)
      conversationService
        .sendMessage(conversationId, challengerId, text, undefined, 'challenge')
        .then((msg) => {
          msg.populate('sender', 'name avatar').then(() => {
            const messageData = {
              _id: (msg._id as any).toString(),
              conversationId,
              sender: { _id: challengerId, name: 'System', avatar: undefined },
              content: text,
              readBy: [],
              createdAt: msg.createdAt,
              updatedAt: msg.updatedAt,
              type: 'challenge',
            };
            io.to(`conv:${conversationId}`).emit('receive_message', messageData);
          });
        })
        .catch((e) => logger.error(e, 'Failed to send quiz result message'));
    }
  }, 3000);
}

export function setupSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          env.CLIENT_URL.trim(),
          env.CLIENT_URL.trim().replace(/\/$/, ''),
          'https://skiill-swapp.vercel.app',
        ];
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
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

  // ── Serialization Helper ────────────────────────────────────────────────────
  // Converts a Mongoose message document (populated sender) to a plain object
  // with all ObjectIds stringified — safe for JSON/Socket.IO transport.
  function serializeMessage(
    msg: import('../models/Message.model').IMessage & {
      sender: { _id: { toString(): string }; name: string; avatar?: string } | import('mongoose').Types.ObjectId;
    },
    tempId?: string
  ) {
    const s = msg.sender as { _id: { toString(): string }; name: string; avatar?: string };
    return {
      _id: msg._id.toString(),
      conversationId: (msg.conversationId as unknown as { toString(): string }).toString(),
      sender: {
        _id: s._id.toString(),
        name: s.name,
        avatar: s.avatar,
      },
      content: msg.content,
      attachment: (msg as any).attachment,
      readBy: msg.readBy.map((id) => id.toString()),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      ...(tempId !== undefined ? { tempId } : {}),
    };
  }

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
      async (data: { conversationId: string; content?: string; tempId: string; attachment?: any }) => {
        try {
          const { conversationId, content, tempId, attachment } = data;

          if (!content?.trim() && !attachment) return;

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
            content?.trim() || '',
            attachment
          );

          await message.populate('sender', 'name avatar');

          // Build plain-object payload with stringified IDs for socket transport
          const messageData = serializeMessage(
            message as Parameters<typeof serializeMessage>[0],
            tempId
          );

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
            messages: messages.map((m) =>
              serializeMessage(m as Parameters<typeof serializeMessage>[0])
            ),
          });
        } catch (error) {
          logger.error({ error, userId: s.userId }, 'Error during backfill');
        }
      }
    );

    // ── Live Quiz Challenges ──────────────────────────────────────────────────
    socket.on('challenge_request', async (data: { conversationId: string; opponentId: string; skill: string }) => {
      try {
        const state = await liveQuizService.createChallenge(data.conversationId, s.userId, data.opponentId, data.skill);
        io.to(`conv:${data.conversationId}`).emit('challenge_request_received', {
          challengeId: state.challengeId,
          challengerId: s.userId,
          skill: data.skill
        });
      } catch (err) {
        logger.error(err, 'Error in challenge_request');
      }
    });

    socket.on('challenge_response', async (data: { conversationId: string; accept: boolean }) => {
      try {
        const state = liveQuizService.getChallenge(data.conversationId);
        if (!state) return;

        if (!data.accept) {
          liveQuizService.removeChallenge(data.conversationId);
          io.to(`conv:${data.conversationId}`).emit('challenge_declined', { userId: s.userId });
          return;
        }

        await liveQuizService.startChallenge(data.conversationId);

        io.to(`conv:${data.conversationId}`).emit('challenge_start', {
          challengeId: state.challengeId,
          skill: state.skill,
          challengerId: state.challengerId,
          opponentId: state.opponentId
        });
        setTimeout(() => broadcastQuestion(io, data.conversationId), 2000);
      } catch (err) {
        logger.error(err, 'Error in challenge_response');
      }
    });

    socket.on('challenge_answer', (data: { conversationId: string; answerIndex: number }) => {
      const state = liveQuizService.getChallenge(data.conversationId);
      if (!state || state.status !== 'active') return;

      const bothAnswered = liveQuizService.submitAnswer(data.conversationId, s.userId, data.answerIndex);
      if (bothAnswered) {
        endRound(io, data.conversationId);
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      clearInterval(heartbeatInterval);
      logger.info({ userId: s.userId, socketId: s.id, reason }, 'Socket disconnected');

      // Forfeit active challenge if any — use a lock flag so only the first
      // disconnect of the two sockets fires the forfeit message.
      const activeChallengeEntry = Array.from(liveQuizService['challenges'].entries()).find(
        ([_, st]) =>
          (st.challengerId === s.userId || st.opponentId === s.userId) &&
          st.status === 'active'
      );
      if (activeChallengeEntry) {
        const [conversationId, state] = activeChallengeEntry;
        if (!(state as any).forfeitSent) {
          (state as any).forfeitSent = true;
          const opponentId = state.challengerId === s.userId ? state.opponentId : state.challengerId;

          io.to(`conv:${conversationId}`).emit('challenge_end', {
            scores: { [s.userId]: -1, [opponentId]: 999 }
          });

          conversationService
            .sendMessage(
              conversationId,
              state.challengerId,
              `<@${s.userId}> disconnected and forfeited the quiz!`,
              undefined,
              'system'
            )
            .then((msg) => {
              const messageData = serializeMessage(msg as any, 'system');
              io.to(`conv:${conversationId}`).emit('receive_message', messageData);
            })
            .catch((e) => logger.error(e));

          liveQuizService.removeChallenge(conversationId);
        }
      }

      await presenceService.setOffline(s.userId);
      socket.broadcast.emit('user_offline', { userId: s.userId });
    });
  });

  return io;
}
