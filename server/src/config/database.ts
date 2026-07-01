import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info({ uri: env.MONGODB_URI.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected');
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    process.exit(1);
  }

  mongoose.connection.on('error', (error) => {
    logger.error({ error }, 'MongoDB runtime error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
