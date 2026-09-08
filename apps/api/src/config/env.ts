import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  JWT_SECRET: z.string().trim().min(32).refine((value) => !value.toLowerCase().includes('replace'), 'Replace the example with a random secret'),
  JWT_EXPIRES_IN: z.string().regex(/^[1-9]\d{0,5}[smhd]$/).default('8h').transform((value) => {
    const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return Number(value.slice(0, -1)) * units[value.slice(-1)];
  }),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      return ['postgresql:', 'postgres:'].includes(url.protocol) && url.hostname.length > 0 && url.pathname.length > 1;
    } catch { return false; }
  }, 'Must be a PostgreSQL URL with a database name'),
  CORS_ORIGIN: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
    } catch { return false; }
  }, 'Must be an HTTP(S) origin without a path or trailing slash'),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  // Report field names only; configuration values may contain secrets.
  throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
}
export const env = result.data;
