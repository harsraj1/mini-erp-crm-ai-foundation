import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { CustomerStatus, CustomerType, Role } from '@prisma/client';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/database.js';
import { addFollowUp } from '../src/services/customer.service.js';

const runId = randomUUID();
const users = Object.values(Role).map((role) => ({ id: randomUUID(), name: `CRM ${role}`, email: `${runId}-${role}@test.example.com`, role }));
const userFor = (role: Role) => users.find((user) => user.role === role)!;
const token = (role: Role) => jwt.sign({}, env.JWT_SECRET, { subject: userFor(role).id, expiresIn: '1h' });
const customerIds: string[] = [];
const missingId = `c${randomUUID().replaceAll('-', '').slice(0, 24)}`;
let fixtureId: string;
const base = () => ({ customerName: 'CRM Customer', mobileNumber: '+919876543210', email: `${randomUUID()}@customers.example.com`,
  businessName: `CRM ${runId}`, customerType: CustomerType.RETAIL, address: '12 Market Road', status: CustomerStatus.LEAD });

async function create(overrides: Record<string, unknown> = {}, role: Role = Role.SALES) {
  const result = await request(app).post('/api/customers').auth(token(role), { type: 'bearer' }).send({ ...base(), ...overrides });
  if (result.body.data?.customer?.id) customerIds.push(result.body.data.customer.id);
  expect(result.status).toBe(201);
  return result.body.data.customer as { id: string; email: string; customerName: string; gstNumber: string | null; followUpDate: string | null; notes: string | null };
}
const detail = (id: string, role: Role = Role.SALES) => request(app).get(`/api/customers/${id}`).auth(token(role), { type: 'bearer' });
const followUp = (id: string, body: object, role: Role = Role.SALES) => request(app).post(`/api/customers/${id}/follow-ups`).auth(token(role), { type: 'bearer' }).send(body);

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(randomUUID(), 12);
  await prisma.user.createMany({ data: users.map((user) => ({ ...user, passwordHash })) });
  const customer = await prisma.customer.create({ data: base() });
  fixtureId = customer.id;
  customerIds.push(customer.id);
});
afterAll(async () => {
  await prisma.customerFollowUp.deleteMany({ where: { customerId: { in: customerIds } } });
  await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
  await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
  await prisma.$disconnect();
});

describe('customer write and detail', () => {
  it('creates without GST, normalizes fields, and retrieves all saved data', async () => {
    const email = `${randomUUID()}@CUSTOMERS.EXAMPLE.COM`;
    const customer = await create({ customerName: '  Sample Customer  ', email, notes: 'Initial profile note', followUpDate: '2026-10-01' });
    expect(customer.customerName).toBe('Sample Customer');
    expect(customer.email).toBe(email.toLowerCase());
    expect(customer.gstNumber).toBeNull();
    const result = await detail(customer.id);
    expect(result.status).toBe(200);
    expect(result.body.data.customer).toMatchObject({ ...customer, followUpDate: '2026-10-01T00:00:00.000Z', followUps: [] });
    expect(result.body.data.customer.createdAt).toBeTruthy();
  });
  it('edits fields and clears optional values without changing untouched fields', async () => {
    const customer = await create({ gstNumber: '27aapfu0939f1zv', notes: 'Old profile', followUpDate: '2026-10-01' });
    expect(customer.gstNumber).toBe('27AAPFU0939F1ZV');
    const result = await request(app).patch(`/api/customers/${customer.id}`).auth(token(Role.ADMIN), { type: 'bearer' })
      .send({ customerName: 'Updated Customer', status: 'ACTIVE', customerType: 'DISTRIBUTOR', notes: null, gstNumber: null, followUpDate: null });
    expect(result.status).toBe(200);
    expect(result.body.data.customer).toMatchObject({ id: customer.id, email: customer.email, customerName: 'Updated Customer', status: 'ACTIVE', customerType: 'DISTRIBUTOR', notes: null, gstNumber: null, followUpDate: null });
    expect((await detail(customer.id)).body.data.customer.customerName).toBe('Updated Customer');
  });
  it.each([
    { customerName: ' ' }, { mobileNumber: '123' }, { mobileNumber: 'abcd1234567' }, { email: 'invalid' },
    { businessName: '' }, { address: ' ' }, { customerType: 'OTHER' }, { status: 'OTHER' },
    { gstNumber: 'bad' }, { followUpDate: '2026-02-30' }, { followUpDate: 'not-a-date' },
    { notes: 123 }, { createdById: 'forged' }, { followUps: [] }, { customerName: null },
  ])('rejects invalid create and patch data %#', async (invalid) => {
    const created = await request(app).post('/api/customers').auth(token(Role.SALES), { type: 'bearer' }).send({ ...base(), ...invalid });
    expect(created.status).toBe(400);
    expect(created.body.error.code).toBe('VALIDATION_ERROR');
    const patched = await request(app).patch(`/api/customers/${fixtureId}`).auth(token(Role.SALES), { type: 'bearer' }).send(invalid);
    expect(patched.status).toBe(400);
  });
  it('rejects missing required fields and an empty update', async () => {
    expect((await request(app).post('/api/customers').auth(token(Role.SALES), { type: 'bearer' }).send({})).status).toBe(400);
    expect((await request(app).patch(`/api/customers/${fixtureId}`).auth(token(Role.SALES), { type: 'bearer' }).send({})).status).toBe(400);
  });
  it.each(['invalid-id', missingId])('returns 400 for invalid IDs and 404 for absent customers (%s)', async (id) => {
    const status = id === missingId ? 404 : 400;
    for (const result of [await detail(id),
      await request(app).patch(`/api/customers/${id}`).auth(token(Role.SALES), { type: 'bearer' }).send({ notes: 'test' }),
      await followUp(id, { note: 'test' })]) {
      expect(result.status).toBe(status);
      expect(result.body.error.code).toBe(status === 404 ? 'CUSTOMER_NOT_FOUND' : 'VALIDATION_ERROR');
    }
  });
});

describe('customer listing', () => {
  it('searches name, business, email, and mobile without case sensitivity', async () => {
    const marker = randomUUID();
    const customer = await create({ customerName: `Name-${marker}`, businessName: `Business-${marker}`, email: `email-${marker}@example.com`, mobileNumber: '918765432109' });
    for (const search of [`NAME-${marker}`, `BUSINESS-${marker}`, `EMAIL-${marker}`, '918765432109']) {
      const result = await request(app).get('/api/customers').auth(token(Role.SALES), { type: 'bearer' }).query({ search });
      expect(result.status).toBe(200);
      expect(result.body.data.customers.map((entry: { id: string }) => entry.id)).toContain(customer.id);
    }
  });
  it('combines search/type/status filters and returns stable pagination and counts', async () => {
    const search = `Pagination-${randomUUID()}`;
    await create({ businessName: search, status: 'ACTIVE', customerType: 'WHOLESALE' });
    await create({ businessName: search, status: 'ACTIVE', customerType: 'WHOLESALE' });
    await create({ businessName: search, status: 'INACTIVE', customerType: 'WHOLESALE' });
    await create({ businessName: search, status: 'ACTIVE', customerType: 'RETAIL' });
    const getPage = (page: number) => request(app).get('/api/customers').auth(token(Role.ACCOUNTS), { type: 'bearer' })
      .query({ search, status: 'ACTIVE', customerType: 'WHOLESALE', page, limit: 1 });
    const first = await getPage(1);
    const second = await getPage(2);
    expect(first.status).toBe(200);
    expect(first.body.data.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(first.body.data.customers).toHaveLength(1);
    expect(second.body.data.customers).toHaveLength(1);
    expect(first.body.data.customers[0].id).not.toBe(second.body.data.customers[0].id);
    expect((await getPage(3)).body.data.customers).toEqual([]);
    const empty = await request(app).get('/api/customers').auth(token(Role.SALES), { type: 'bearer' }).query({ search: randomUUID() });
    expect(empty.body.data).toEqual({ customers: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  });
  it('treats wildcard search characters literally', async () => {
    const marker = randomUUID();
    const literal = await create({ customerName: `${marker}%_literal` });
    await create({ customerName: `${marker}anythingliteral` });
    const result = await request(app).get('/api/customers').auth(token(Role.SALES), { type: 'bearer' }).query({ search: `${marker}%_` });
    expect(result.body.data.customers.map((entry: { id: string }) => entry.id)).toEqual([literal.id]);
  });
  it.each(['page=0', 'page=-1', 'page=1.5', 'page=1000001', 'limit=101', 'limit=0', 'limit=abc',
    'status=UNKNOWN', 'customerType=UNKNOWN', 'page=1&page=2', 'unknown=value'])('rejects invalid query %s', async (query) => {
    const result = await request(app).get(`/api/customers?${query}`).auth(token(Role.SALES), { type: 'bearer' });
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('follow-up history', () => {
  it('retains separate notes and author metadata while managing the next date', async () => {
    const customer = await create({ notes: 'Profile notes', followUpDate: '2026-10-01' });
    const first = await followUp(customer.id, { note: '  First call  ', followUpDate: '2026-10-02T10:00:00+05:30' });
    expect(first.status).toBe(201);
    expect(first.body.data.followUp).toMatchObject({ note: 'First call', customerId: customer.id, createdById: userFor(Role.SALES).id,
      followUpDate: '2026-10-02T04:30:00.000Z', createdBy: { id: userFor(Role.SALES).id, role: 'SALES' } });
    expect(first.body.data.followUp.createdAt).toBeTruthy();
    expect(first.text).not.toContain('passwordHash');
    const second = await followUp(customer.id, { note: 'Second call' }, Role.ADMIN);
    expect(second.status).toBe(201);
    let saved = (await detail(customer.id)).body.data.customer;
    expect(saved.notes).toBe('Profile notes');
    expect(saved.followUpDate).toBe('2026-10-02T04:30:00.000Z');
    expect(saved.followUps).toHaveLength(2);
    expect(saved.followUps.map((entry: { note: string }) => entry.note)).toEqual(['Second call', 'First call']);
    expect((await followUp(customer.id, { note: 'Completed', followUpDate: null })).status).toBe(201);
    await request(app).patch(`/api/customers/${customer.id}`).auth(token(Role.SALES), { type: 'bearer' }).send({ notes: 'Edited profile' });
    saved = (await detail(customer.id, Role.ACCOUNTS)).body.data.customer;
    expect(saved.followUpDate).toBeNull();
    expect(saved.followUps).toHaveLength(3);
    expect(saved.followUps[2].note).toBe('First call');
    expect(saved.followUps[2].followUpDate).toBe('2026-10-02T04:30:00.000Z');
    expect(JSON.stringify(saved)).not.toContain('passwordHash');
  });
  it.each([{}, { note: '' }, { note: ' ' }, { note: 'x', followUpDate: '2026-02-30' },
    { note: 'x', createdById: 'forged' }, { note: 42 }])('rejects invalid or forged follow-up data %#', async (body) => {
    const result = await followUp(fixtureId, body);
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('rolls back the schedule when history insertion fails', async () => {
    const customer = await create({ followUpDate: '2026-10-01' });
    await expect(addFollowUp(customer.id, randomUUID(), { note: 'Must roll back', followUpDate: new Date('2026-11-01') })).rejects.toThrow();
    const result = await detail(customer.id);
    expect(result.body.data.customer.followUpDate).toBe('2026-10-01T00:00:00.000Z');
    expect(result.body.data.customer.followUps).toEqual([]);
  });
});

describe('CRM role permissions', () => {
  it.each(Object.values(Role))('enforces read/write permissions for %s on every endpoint', async (role) => {
    const canWrite = role === Role.ADMIN || role === Role.SALES;
    const canRead = role !== Role.WAREHOUSE;
    const list = await request(app).get('/api/customers').auth(token(role), { type: 'bearer' });
    expect(list.status).toBe(canRead ? 200 : 403);
    expect((await detail(fixtureId, role)).status).toBe(canRead ? 200 : 403);
    const created = await request(app).post('/api/customers').auth(token(role), { type: 'bearer' }).send(base());
    if (created.body.data?.customer?.id) customerIds.push(created.body.data.customer.id);
    expect(created.status).toBe(canWrite ? 201 : 403);
    const patched = await request(app).patch(`/api/customers/${fixtureId}`).auth(token(role), { type: 'bearer' }).send({ notes: 'Role test' });
    expect(patched.status).toBe(canWrite ? 200 : 403);
    expect((await followUp(fixtureId, { note: 'Role test' }, role)).status).toBe(canWrite ? 201 : 403);
    if (!canWrite) expect(created.body.error.code).toBe('FORBIDDEN');
  });
  it('rejects unauthenticated access on every endpoint', async () => {
    const results = [await request(app).get('/api/customers'), await request(app).post('/api/customers').send(base()),
      await request(app).get(`/api/customers/${fixtureId}`), await request(app).patch(`/api/customers/${fixtureId}`).send({ notes: 'No auth' }),
      await request(app).post(`/api/customers/${fixtureId}/follow-ups`).send({ note: 'No auth' })];
    for (const result of results) { expect(result.status).toBe(401); expect(result.body.error.code).toBe('UNAUTHORIZED'); }
  });
});
