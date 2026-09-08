import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

// Liveness only. Use db:check to verify database connectivity.
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});
app.use('/api/auth', authRouter);
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});
app.use(errorHandler);
