import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Factory that returns a middleware validating req.body, req.query, or req.params
 * against a Zod schema. On failure, passes a ZodError to next() which is handled
 * by the centralized error handler.
 */
export function validate(schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req[source]);
      req[source] = validated; // replace with coerced/stripped values
      next();
    } catch (error) {
      next(error);
    }
  };
}
