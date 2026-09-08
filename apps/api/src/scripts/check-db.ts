import { checkDatabase, prisma } from '../config/database.js';

try {
  await checkDatabase();
  console.log('Database connection successful (SELECT 1).');
} catch {
  console.error('Database connection failed. Check DATABASE_URL, credentials, and PostgreSQL availability.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
