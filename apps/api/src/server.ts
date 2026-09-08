import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

const server = app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
server.on('error', () => {
  console.error('API could not listen on the configured port.');
  process.exitCode = 1;
});

function shutdown(): void {
  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();
  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0), () => process.exit(1));
  });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
