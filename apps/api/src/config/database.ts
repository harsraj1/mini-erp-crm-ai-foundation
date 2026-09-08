import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

export async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
