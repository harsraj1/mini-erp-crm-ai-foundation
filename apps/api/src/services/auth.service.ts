import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const safeUserSelect = { id: true, name: true, email: true, role: true } satisfies Prisma.UserSelect;
export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;
// Unknown users still incur a password comparison; never expose whether an email exists.
const dummyHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { ...safeUserSelect, passwordHash: true } });
  const matches = await bcrypt.compare(password, user?.passwordHash ?? await dummyHash);
  if (!user || !matches) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  const safeUser: SafeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign({}, env.JWT_SECRET, { algorithm: 'HS256', subject: user.id, expiresIn: env.JWT_EXPIRES_IN });
  return { token, user: safeUser };
}

export async function authenticateToken(token: string): Promise<SafeUser> {
  let subject: string;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || !payload.sub || typeof payload.exp !== 'number') {
      throw new Error('Invalid token claims');
    }
    subject = payload.sub;
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token');
  }
  // Use the current database role, not potentially outdated JWT claims.
  const user = await prisma.user.findUnique({ where: { id: subject }, select: safeUserSelect });
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token');
  return user;
}
