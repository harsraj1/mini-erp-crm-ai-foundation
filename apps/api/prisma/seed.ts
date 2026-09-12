import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 12 || Buffer.byteLength(password) > 72) {
  throw new Error('Set DEMO_PASSWORD to a demo-only password between 12 characters and 72 bytes');
}
const prisma = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(Object.values(Role).map((role) => {
    const email = `${role.toLowerCase()}@demo.example.com`;
    return prisma.user.upsert({ where: { email }, update: {},
      create: { name: `Demo ${role.toLowerCase()}`, email, passwordHash, role } });
  }));
  console.log('Demo accounts ensured for all roles, including Operations. Existing accounts were preserved.');
} finally {
  await prisma.$disconnect();
}
