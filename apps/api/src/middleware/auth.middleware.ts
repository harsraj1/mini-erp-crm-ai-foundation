import type { RequestHandler } from 'express';
import { authenticateToken } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') ?? '');
  if (!match) throw new AppError(401, 'UNAUTHORIZED', 'A Bearer authentication token is required');
  req.user = await authenticateToken(match[1]);
  next();
};
