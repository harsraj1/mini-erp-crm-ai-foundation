import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../utils/app-error.js';

export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required');
    if (!roles.includes(req.user.role)) throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
    next();
  };
}
