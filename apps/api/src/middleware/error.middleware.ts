import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data',
      details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })) } });
    return;
  }
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  const badRequest = status === 400 || status === 413;
  res.status(badRequest ? status : 500).json({ success: false, error: {
    code: badRequest ? 'INVALID_REQUEST' : 'INTERNAL_ERROR',
    message: badRequest ? 'Invalid or oversized JSON request body' : 'An unexpected error occurred',
  } });
};
