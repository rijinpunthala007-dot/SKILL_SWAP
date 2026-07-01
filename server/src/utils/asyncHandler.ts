import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to forward rejections to Express error middleware.
 * Eliminates repetitive try/catch in every controller.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
