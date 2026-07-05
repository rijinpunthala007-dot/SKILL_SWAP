// Config validation MUST run first — fails fast if env is misconfigured
import './config/env';

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import pinoHttp from 'pino-http';
import path from 'path';

import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis, pingRedis } from './config/redis';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketServer } from './sockets/socketServer';

// Import side-effect: registers all internal event handlers
import './events/internalEvents';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import exchangeRequestRoutes from './routes/exchangeRequest.routes';
import conversationRoutes from './routes/conversation.routes';
import quizRoutes from './routes/quiz.routes';
import endorsementRoutes from './routes/endorsement.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();
const httpServer = http.createServer(app);

// ── Security ────────────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Essential for rate limiting behind a reverse proxy like Render
app.use(helmet());
app.use(
  cors({
    origin: [env.CLIENT_URL, env.CLIENT_URL.replace(/\/$/, '')],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// Global rate limit (auth routes have stricter limits defined in their router)
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Observability ────────────────────────────────────────────────────────────
app.use(requestId);
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res) => (res.statusCode >= 500 ? 'error' : 'info'),
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} → ${res.statusCode}`,
    genReqId: (req) => (req as express.Request).id,
  })
);

// ── Static uploads (local disk fallback) ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const [dbOk, redisOk] = await Promise.all([
    (async () => {
      try {
        const mongoose = await import('mongoose');
        return mongoose.default.connection.readyState === 1;
      } catch {
        return false;
      }
    })(),
    pingRedis(),
  ]);

  const status = dbOk && redisOk ? 'healthy' : 'degraded';
  const httpStatus = status === 'healthy' ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    services: { database: dbOk ? 'up' : 'down', redis: redisOk ? 'up' : 'down' },
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', exchangeRequestRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', endorsementRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ── Centralized Error Handler (must be last middleware) ───────────────────────
app.use(errorHandler);

// ── Socket.IO ────────────────────────────────────────────────────────────────
let io: any;
if (process.env.NODE_ENV !== 'test') {
  io = setupSocketServer(httpServer);
}

// ── Startup ───────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  httpServer.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, `SkillSwap server started`);
  });
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received, draining...');

  // Stop accepting new connections
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    // Close Socket.IO
    if (io) {
      await new Promise<void>((resolve) => io.close(() => resolve()));
      logger.info('Socket.IO closed');
    }

    // Close DB and Redis
    await Promise.all([disconnectDatabase(), disconnectRedis()]);

    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Programmer errors — log and exit in production (let supervisor restart)
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception — shutting down');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app, httpServer, io };
