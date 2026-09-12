import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { env } from '../src/config/env.js';

const run = randomUUID();
const users = [Role.ADMIN, Role.OPERATIONS, Role.SALES, Role.ACCOUNTS].map(role => ({
  id: randomUUID(), name: `Operations test ${role}`, role, email: `${run}-${role}@test.local`, passwordHash: 'not-a-login-account',
}));
const actor = (role: Role) => users.find(u => u.role === role)!;
const token = (role: Role) => jwt.sign({}, env.JWT_SECRET, { subject: actor(role).id, expiresIn: '1h' });
const post = (path: string, body: object, role: Role = Role.OPERATIONS) => request(app).post(`/api/operations/${path}`).auth(token(role), { type: 'bearer' }).send(body);
const get = (path: string, role: Role = Role.OPERATIONS) => request(app).get(`/api/operations/${path}`).auth(token(role), { type: 'bearer' });
const items: string[] = [], locations: string[] = [];
let sourceLocation: string, destinationLocation: string;
beforeAll(async () => {
  await prisma.user.createMany({ data: users });
  for (const name of [`${run}-Source`, `${run}-Destination`]) {
    const r = await post('locations', { name }); expect(r.status).toBe(201); locations.push(r.body.data.id);
  }
  [sourceLocation, destinationLocation] = locations;
});
afterAll(async () => {
  const balances = { itemId: { in: items } };
  await prisma.inventoryEvent.deleteMany({ where: { balance: balances } });
  await prisma.customerOrder.deleteMany({ where: { balance: balances } });
  await prisma.internalTransfer.deleteMany({ where: { sourceBalance: balances } });
  await prisma.workOrder.deleteMany({ where: { itemId: { in: items } } });
  await prisma.inventoryBalance.deleteMany({ where: balances });
  await prisma.item.deleteMany({ where: { id: { in: items } } });
  await prisma.location.deleteMany({ where: { id: { in: locations } } });
  await prisma.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } });
  await prisma.$disconnect();
});
async function stock(quantity = 100) {
  const item = await post('items', { name: `Material ${run}`, code: randomUUID(), category: 'Raw material' });
  expect(item.status).toBe(201); items.push(item.body.data.id);
  const r = await post('inventory', { requestId: randomUUID(), itemId: item.body.data.id, locationId: sourceLocation, batch: 'B1', physicalQuantity: quantity });
  expect(r.status).toBe(201); expect(r.body.data.availableQuantity).toBe(quantity); return r.body.data as { id: string; itemId: string };
}
const balance = (id: string) => prisma.inventoryBalance.findUniqueOrThrow({ where: { id } });
const reservation = (id: string, quantity: number, requestId = randomUUID()) => ({ requestId, balanceId: id, quantity, customerName: 'Test customer' });
const transfer = (id: string, quantity: number) => ({ requestId: randomUUID(), sourceBalanceId: id, destinationLocationId: destinationLocation, quantity });

describe('reservation and inventory invariants', () => {
  it('reserves stock without changing physical quantity, with a transaction log', async () => {
    const b = await stock(); const r = await post('orders', reservation(b.id, 30), Role.SALES);
    expect(r.status).toBe(201); expect(await balance(b.id)).toMatchObject({ physicalQuantity: 100, reservedQuantity: 30 });
    const list = await get('inventory?search=Material&limit=100');
    expect(list.body.data.rows.find((x: { id: string }) => x.id === b.id).availableQuantity).toBe(70);
    const history = await get(`inventory/${b.id}/history`);
    expect(history.body.data.rows).toEqual(expect.arrayContaining([expect.objectContaining({ physicalChange: 0, reservedChange: 30 })]));
    expect(history.text).not.toContain('passwordHash');
  });
  it('rejects over-reservation and leaves quantities, orders and logs unchanged', async () => {
    const b = await stock(10); const r = await post('orders', reservation(b.id, 11), Role.SALES);
    expect(r.status).toBe(409); expect(r.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(await balance(b.id)).toMatchObject({ physicalQuantity: 10, reservedQuantity: 0 });
    expect(await prisma.customerOrder.count({ where: { balanceId: b.id } })).toBe(0);
    expect(await prisma.inventoryEvent.count({ where: { balanceId: b.id } })).toBe(1);
  });
  it('serializes competing reservations of 80 and 50 against 100', async () => {
    const b = await stock();
    const results = await Promise.all([80, 50].map(q => post('orders', reservation(b.id, q), Role.SALES)));
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    const current = await balance(b.id); expect([80, 50]).toContain(current.reservedQuantity); expect(current.physicalQuantity).toBe(100);
    expect(await prisma.customerOrder.count({ where: { balanceId: b.id } })).toBe(1);
  });
  it('rejects duplicate order requests without reserving twice', async () => {
    const b = await stock(); const body = reservation(b.id, 20);
    const results = await Promise.all([post('orders', body, Role.SALES), post('orders', body, Role.SALES)]);
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    expect((await balance(b.id)).reservedQuantity).toBe(20);
    expect(await prisma.inventoryEvent.count({ where: { balanceId: b.id } })).toBe(2);
  });
  it('adjusts stock atomically, protects reserved units and rolls back duplicate logs', async () => {
    const b = await stock(10); await post('orders', reservation(b.id, 6), Role.SALES);
    expect((await post(`inventory/${b.id}/adjust`, { requestId: randomUUID(), direction: 'OUT', quantity: 5, reason: 'Dispatch' })).status).toBe(409);
    const body = { requestId: randomUUID(), direction: 'IN', quantity: 5, reason: 'Delivery' };
    expect((await post(`inventory/${b.id}/adjust`, body)).status).toBe(200);
    expect((await post(`inventory/${b.id}/adjust`, body)).status).toBe(409);
    expect(await balance(b.id)).toMatchObject({ physicalQuantity: 15, reservedQuantity: 6 });
    expect((await post(`inventory/${b.id}/adjust`, { ...body, requestId: randomUUID(), direction: 'OUT', quantity: 9 })).status).toBe(200);
    expect(await balance(b.id)).toMatchObject({ physicalQuantity: 6, reservedQuantity: 6 });
  });
  it.each([0, -1, 1.5, 2147483648, '10'])('rejects invalid order quantity %s', async quantity => {
    expect((await post('orders', { requestId: randomUUID(), customerName: 'A', balanceId: 'cmtestbalance0000000000000', quantity }, Role.SALES)).status).toBe(400);
  });
});

describe('internal transfer lifecycle', () => {
  it('rejects excess quantity and transfer to the same location', async () => {
    const b = await stock(10);
    expect((await post('transfers', transfer(b.id, 11))).status).toBe(409);
    expect((await post('transfers', { ...transfer(b.id, 5), destinationLocationId: sourceLocation })).status).toBe(400);
    expect((await balance(b.id)).physicalQuantity).toBe(10);
  });
  it('changes source only on dispatch, destination only on receipt, and prevents duplicates', async () => {
    const b = await stock(); const create = await post('transfers', transfer(b.id, 40)); expect(create.status).toBe(201);
    const id = create.body.data.id;
    expect((await balance(b.id)).physicalQuantity).toBe(100);
    expect((await post(`transfers/${id}/receive`, {})).status).toBe(409);
    const dispatched = await post(`transfers/${id}/dispatch`, {}); expect(dispatched.status).toBe(200);
    expect(dispatched.body.data.status).toBe('DISPATCHED'); expect((await balance(b.id)).physicalQuantity).toBe(60);
    expect(await prisma.inventoryBalance.count({ where: { itemId: b.itemId, locationId: destinationLocation } })).toBe(0);
    expect((await post(`transfers/${id}/dispatch`, {})).status).toBe(409);
    const receipts = await Promise.all([post(`transfers/${id}/receive`, {}), post(`transfers/${id}/receive`, {})]);
    expect(receipts.map(r => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.inventoryBalance.findFirst({ where: { itemId: b.itemId, locationId: destinationLocation } })).toMatchObject({ physicalQuantity: 40, reservedQuantity: 0, batch: 'B1' });
    expect(await prisma.inventoryEvent.count({ where: { requestId: `receive:${id}` } })).toBe(1);
  });
  it('rechecks availability at dispatch after a new reservation and rolls back failure', async () => {
    const b = await stock(); const t = await post('transfers', transfer(b.id, 80));
    await post('orders', reservation(b.id, 30), Role.SALES);
    expect((await post(`transfers/${t.body.data.id}/dispatch`, {})).status).toBe(409);
    expect(await balance(b.id)).toMatchObject({ physicalQuantity: 100, reservedQuantity: 30 });
    expect((await prisma.internalTransfer.findUniqueOrThrow({ where: { id: t.body.data.id } })).status).toBe('REQUESTED');
    expect(await prisma.inventoryEvent.count({ where: { requestId: `dispatch:${t.body.data.id}` } })).toBe(0);
  });
  it('serializes a dispatch competing with a reservation', async () => {
    const b = await stock(); const t = await post('transfers', transfer(b.id, 80));
    const responses = await Promise.all([post(`transfers/${t.body.data.id}/dispatch`, {}), post('orders', reservation(b.id, 50), Role.SALES)]);
    expect(responses.filter(r => r.status < 300)).toHaveLength(1); expect(responses.filter(r => r.status === 409)).toHaveLength(1);
    const current = await balance(b.id); expect(current.physicalQuantity - current.reservedQuantity).toBeGreaterThanOrEqual(0);
  });
  it('accepts simultaneous first receipts into the same destination batch exactly once each', async () => {
    const b = await stock(); const ids: string[] = [];
    for (const q of [20, 30]) { const t = await post('transfers', transfer(b.id, q)); ids.push(t.body.data.id); expect((await post(`transfers/${t.body.data.id}/dispatch`, {})).status).toBe(200); }
    const r = await Promise.all(ids.map(id => post(`transfers/${id}/receive`, {}))); expect(r.map(x => x.status)).toEqual([200, 200]);
    expect(await prisma.inventoryBalance.findFirst({ where: { itemId: b.itemId, locationId: destinationLocation } })).toMatchObject({ physicalQuantity: 50 });
  });
});

describe('work orders and authorization', () => {
  it('shows shortage and alternative stock and enforces status sequence', async () => {
    const b = await stock(60);
    await post('inventory', { requestId: randomUUID(), itemId: b.itemId, locationId: destinationLocation, batch: 'B2', physicalQuantity: 50 });
    const r = await post('work-orders', { requestId: randomUUID(), itemId: b.itemId, locationId: sourceLocation, requiredQuantity: 100, assignedUserId: actor(Role.OPERATIONS).id }, Role.ADMIN);
    expect(r.status).toBe(201); const id = r.body.data.id;
    const list = await get('work-orders'); const work = list.body.data.rows.find((w: { id: string }) => w.id === id);
    expect(work).toMatchObject({ availableQuantity: 60, shortage: 40 }); expect(work.alternatives[0]).toMatchObject({ availableQuantity: 50 });
    const patch = (status: string, role = Role.OPERATIONS) => request(app).patch(`/api/operations/work-orders/${id}`).auth(token(role), { type: 'bearer' }).send({ status });
    expect((await patch('COMPLETED')).status).toBe(409); expect((await patch('IN_PROGRESS')).status).toBe(200); expect((await patch('COMPLETED')).status).toBe(200);
    expect((await balance(b.id)).physicalQuantity).toBe(60);
  });
  it('requires authentication and rejects restricted actions on the backend', async () => {
    expect((await request(app).get('/api/operations/inventory')).status).toBe(401);
    for (const path of ['items', 'locations', 'inventory', 'transfers', 'work-orders']) expect((await post(path, {}, Role.SALES)).status).toBe(403);
    expect((await post('orders', {}, Role.OPERATIONS)).status).toBe(403);
    expect((await post('orders', {}, Role.ACCOUNTS)).status).toBe(403);
    expect((await get('assignees', Role.SALES)).status).toBe(403);
    for (const role of [Role.ADMIN, Role.OPERATIONS, Role.SALES]) expect((await get('inventory', role)).status).toBe(200);
  });
});
