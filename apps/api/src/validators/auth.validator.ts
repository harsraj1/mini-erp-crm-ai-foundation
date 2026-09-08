import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 bytes'),
}).strict();
