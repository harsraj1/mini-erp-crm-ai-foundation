import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { env } from './config/env.js';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

// Liveness only. Use db:check to verify database connectivity.
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});
const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  const badRequest = status === 400 || status === 413;
  res.status(badRequest ? status : 500).json({
    success: false,
    error: { code: badRequest ? 'INVALID_REQUEST' : 'INTERNAL_ERROR', message: badRequest ? 'Invalid or oversized JSON request body' : 'An unexpected error occurred' },
  });
};
app.use(errorHandler);
