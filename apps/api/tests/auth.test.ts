import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { env, envSchema } from '../src/config/env.js';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { authorize } from '../src/middleware/authorize.middleware.js';
import { errorHandler } from '../src/middleware/error.middleware.js';

const runId = randomUUID();
const password = `Test-${randomUUID()}`;
const users = Object.values(Role).map((role) => ({ id: randomUUID(), name: `Test ${role}`, email: `${runId}-${role.toLowerCase()}@test.example.com`, role }));
const admin = users.find((user) => user.role === Role.ADMIN)!;
const sales = users.find((user) => user.role === Role.SALES)!;
const tokenFor = (id: string) => jwt.sign({}, env.JWT_SECRET, { subject: id, algorithm: 'HS256', expiresIn: '1h' });
// Exercise the reusable role middleware without adding test-only production endpoints.
const restricted = express();
restricted.get('/admin', authenticate, authorize(Role.ADMIN), (_req, res) => res.sendStatus(204));
restricted.get('/unguarded', authorize(Role.ADMIN), (_req, res) => res.sendStatus(204));
restricted.use(errorHandler);

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.createMany({ data: users.map((user) => ({ ...user, passwordHash })) });
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
  await prisma.$disconnect();
});

describe('login and current user', () => {
  it.each(users)('logs in $role and returns only safe user fields', async (user) => {
    const response = await request(app).post('/api/auth/login').send({ email: ` ${user.email.toUpperCase()} `, password });
    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
    expect(response.text).not.toContain('passwordHash');
    expect(response.headers['cache-control']).toBe('no-store');
    const claims = jwt.verify(response.body.data.token, env.JWT_SECRET);
    expect(claims).toMatchObject({ sub: user.id });
    const me = await request(app).get('/api/auth/me').auth(response.body.data.token, { type: 'bearer' });
    expect(me.status).toBe(200);
    expect(me.body.data.user).toEqual(user);
    expect(me.text).not.toContain('passwordHash');
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, stored.passwordHash)).toBe(true);
  });

  it('returns the same 401 for wrong password and unknown email', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'wrong' });
    const unknown = await request(app).post('/api/auth/login').send({ email: `${runId}@missing.example.com`, password });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it.each([{}, { email: 'bad', password }, { email: admin.email }, { email: admin.email, password: '' },
    { email: admin.email, password: 'é'.repeat(37) }, { email: admin.email, password, role: 'ADMIN' }])('rejects invalid login input %#', async (body) => {
    const result = await request(app).post('/api/auth/login').send(body);
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retains health, 404 and malformed JSON responses', async () => {
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/missing')).status).toBe(404);
    const result = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{');
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('INVALID_REQUEST');
  });
});

describe('authentication and authorization', () => {
  it('rejects missing authentication', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(restricted).get('/unguarded')).status).toBe(401);
  });
  it.each([
    'Basic abc', 'Bearer malformed', 'Bearer a b',
    `Bearer ${jwt.sign({}, 'different-test-signing-key', { subject: admin.id, expiresIn: '1h' })}`,
    `Bearer ${jwt.sign({}, env.JWT_SECRET, { subject: admin.id, expiresIn: -1 })}`,
    `Bearer ${jwt.sign({}, env.JWT_SECRET, { subject: admin.id, algorithm: 'HS384', expiresIn: '1h' })}`,
    `Bearer ${jwt.sign({}, env.JWT_SECRET, { subject: admin.id })}`,
    `Bearer ${jwt.sign({}, env.JWT_SECRET, { expiresIn: '1h' })}`,
    `Bearer ${tokenFor(randomUUID())}`,
  ])('rejects invalid/expired/unknown-user token %#', async (header) => {
    const result = await request(app).get('/api/auth/me').set('Authorization', header);
    expect(result.status).toBe(401);
    expect(result.body.error.code).toBe('UNAUTHORIZED');
    expect(result.text).not.toContain('passwordHash');
  });
  it.each(users)('enforces the admin-only role boundary for $role', async (user) => {
    const result = await request(restricted).get('/admin').auth(tokenFor(user.id), { type: 'bearer' });
    expect(result.status).toBe(user.role === Role.ADMIN ? 204 : 403);
    if (user.role !== Role.ADMIN) expect(result.body.error.code).toBe('FORBIDDEN');
  });
  it('uses current database role instead of forged or stale role claims', async () => {
    const forgedRole = jwt.sign({ role: 'ADMIN' }, env.JWT_SECRET, { subject: sales.id, expiresIn: '1h' });
    expect((await request(restricted).get('/admin').auth(forgedRole, { type: 'bearer' })).status).toBe(403);
    const token = tokenFor(admin.id);
    await prisma.user.update({ where: { id: admin.id }, data: { role: Role.ACCOUNTS } });
    try {
      expect((await request(restricted).get('/admin').auth(token, { type: 'bearer' })).status).toBe(403);
    } finally {
      await prisma.user.update({ where: { id: admin.id }, data: { role: Role.ADMIN } });
    }
  });
  it('keeps unexpected database failures as safe 500s, not auth errors', async () => {
    const spy = vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('private-database-details'));
    try {
      const result = await request(app).get('/api/auth/me').auth(tokenFor(admin.id), { type: 'bearer' });
      expect(result.status).toBe(500);
      expect(result.body.error.code).toBe('INTERNAL_ERROR');
      expect(result.text).not.toContain('private-database-details');
    } finally { spy.mockRestore(); }
  });
});

describe('JWT environment validation', () => {
  it.each([undefined, '', 'short', 'replace_with_a_generated_random_secret'])('rejects missing/weak/placeholder secret %#', (secret) => {
    expect(envSchema.safeParse({ ...process.env, JWT_SECRET: secret }).success).toBe(false);
  });
  it.each(['0h', '-1h', '8', 'invalid'])('rejects invalid token lifetime %s', (lifetime) => {
    expect(envSchema.safeParse({ ...process.env, JWT_EXPIRES_IN: lifetime }).success).toBe(false);
  });
});
