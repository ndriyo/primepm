import type { Context } from 'hono';
import { ZodError } from 'zod';

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (msg = 'not_found') => new HttpError(404, msg);
export const forbidden = (msg = 'forbidden') => new HttpError(403, msg);
export const badRequest = (msg = 'bad_request', details?: unknown) =>
  new HttpError(400, msg, details);

export function handleError(err: unknown, c: Context): Response {
  if (err instanceof HttpError) {
    return c.json({ error: err.message, details: err.details }, err.status as 400 | 403 | 404);
  }
  if (err instanceof ZodError) {
    return c.json({ error: 'validation_error', details: err.flatten() }, 422);
  }
  console.error('unhandled error', err);
  return c.json({ error: 'internal_error' }, 500);
}
