import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to carry the request ID
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Attaches a unique request-id to every request.
 * Respects X-Request-Id header so upstream proxies/load-balancers can inject their own.
 * Every Pino log line should include req.id for full traceability.
 */
export function requestId(req: Request, _res: Response, next: NextFunction): void {
  req.id = (req.headers['x-request-id'] as string) ?? uuidv4();
  next();
}
