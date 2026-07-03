import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // AppError: operational, expected errors
  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error(
        { error, requestId: req.id, path: req.path, method: req.method },
        'Non-operational AppError'
      );
    } else {
      logger.warn(
        { code: error.code, statusCode: error.statusCode, path: req.path },
        error.message
      );
    }

    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }

  // Zod validation errors from middleware
  if (error instanceof ZodError) {
    const message = error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');

    logger.warn({ validationErrors: error.errors, path: req.path }, 'Validation error');

    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message },
    });
    return;
  }

  // Mongoose duplicate key
  if (
    error instanceof mongoose.Error.ValidationError ||
    (error as { code?: unknown })?.code === 11000
  ) {
    const mongoError = error as { keyValue?: Record<string, unknown> };
    const field = Object.keys(mongoError.keyValue ?? {})[0] ?? 'field';
    logger.warn({ error, path: req.path }, 'MongoDB duplicate key error');

    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_KEY', message: `${field} already exists` },
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid resource ID format' },
    });
    return;
  }

  // Unknown / programmer error — log loudly, never expose internals
  logger.error(
    { error, requestId: req.id, path: req.path, method: req.method, stack: (error as Error)?.stack },
    'Unhandled error'
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: (error as Error)?.message ?? 'Unknown error',
      stack: (error as Error)?.stack ?? ''
    },
  });
}
