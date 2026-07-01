/**
 * Canonical API response shape.
 * Every endpoint returns one of these two shapes — no exceptions.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}
