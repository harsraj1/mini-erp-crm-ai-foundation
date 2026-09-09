import { beforeAll, afterAll, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { app } from '../src/app.js';
import * as challans from '../src/services/challan.service.js';

let actor: string, customerId: string;
const productIds: string[] = [], challanIds: string[] = [];
const token = () => jwt.sign({}, env.JWT_SECRET, { subject: actor, expiresIn: '1h' });
beforeAll(async () => {
  actor = (await prisma.user.create({ data: { name:'Challan test', email:`${randomUUID()}@test.local`, passwordHash:await bcrypt.hash(randomUUID(),4), role:'SALES' } })).id;
  customerId = (await prisma.customer.create({ data: { customerName:'Test', mobileNumber:'1234567890', email:'test@example.com', businessName:'Test', customerType:'RETAIL', address:'Test', status:'ACTIVE' } })).id;
});
afterAll(async () => {
  await prisma.stockMovement.deleteMany({ where:{ productId:{in:productIds} } });
  await prisma.challan.deleteMany({ where:{id:{in:challanIds}} });
  await prisma.product.deleteMany({ where:{id:{in:productIds}} });
  await prisma.customer.delete({where:{id:customerId}});
  await prisma.user.delete({where:{id:actor}});
  await prisma.$disconnect();
});
async function product(stock=10) {
  const p=await prisma.product.create({data:{productName:'Original',sku:randomUUID(),category:'Test',unitPrice:'12.50',currentStock:stock,warehouseLocation:'Test'}});
  productIds.push(p.id);return p;
}
async function draft(items:{productId:string;quantity:number}[]) {
  const r=await request(app).post('/api/challans').auth(token(),{type:'bearer'}).send({customerId,items});
  expect(r.status).toBe(201);challanIds.push(r.body.data.challan.id);return challans.detail(r.body.data.challan.id);
}
const stock=async(id:string)=>(await prisma.product.findUniqueOrThrow({where:{id}})).currentStock;
const logs=(id:string)=>prisma.stockMovement.findMany({where:{productId:id}});
it('draft preserves stock, snapshots, totals and safe creator data',async()=>{
  const p=await product();const c=await draft([{productId:p.id,quantity:3}]);
  expect(c.status).toBe('DRAFT');expect(c.totalQuantity).toBe(3);expect(c.challanNumber).toBeTruthy();
  expect(c.createdBy).not.toHaveProperty('passwordHash');expect(await stock(p.id)).toBe(10);expect(await logs(p.id)).toHaveLength(0);
  await prisma.product.update({where:{id:p.id},data:{productName:'Changed',sku:randomUUID(),unitPrice:999}});
  const saved=await challans.detail(c.id);expect(saved.items[0]).toMatchObject({productNameSnapshot:'Original',skuSnapshot:p.sku,quantity:3});expect(saved.items[0].unitPriceSnapshot.toString()).toBe('12.5');
});
it('confirms multiple products and logs each deduction exactly once',async()=>{
  const a=await product(),b=await product();const c=await draft([{productId:a.id,quantity:3},{productId:b.id,quantity:10}]);
  const r=await request(app).post(`/api/challans/${c.id}/confirm`).auth(token(),{type:'bearer'});
  expect(r.status).toBe(200);expect(r.body.data.challan.status).toBe('CONFIRMED');expect(await stock(a.id)).toBe(7);expect(await stock(b.id)).toBe(0);
  expect((await logs(a.id))[0]).toMatchObject({quantityChanged:3,movementType:'OUT',createdById:actor});
  expect(await logs(b.id)).toHaveLength(1);await expect(challans.confirm(c.id,actor)).rejects.toMatchObject({status:409});expect(await stock(a.id)).toBe(7);
});
it('insufficient stock leaves all products, logs and draft unchanged',async()=>{
  const a=await product(),b=await product(1);const c=await draft([{productId:a.id,quantity:3},{productId:b.id,quantity:2}]);
  await expect(challans.confirm(c.id,actor)).rejects.toMatchObject({code:'INSUFFICIENT_STOCK'});
  expect(await stock(a.id)).toBe(10);expect(await stock(b.id)).toBe(1);expect(await logs(a.id)).toHaveLength(0);expect((await challans.detail(c.id)).status).toBe('DRAFT');
});
it('rolls back stock when movement insertion fails',async()=>{
  const p=await product();const c=await draft([{productId:p.id,quantity:2}]);
  await expect(challans.confirm(c.id,'missing-user')).rejects.toBeDefined();
  expect(await stock(p.id)).toBe(10);expect(await logs(p.id)).toHaveLength(0);expect((await challans.detail(c.id)).status).toBe('DRAFT');
});
it('concurrent confirmations of the same draft deduct once',async()=>{
  const p=await product();const c=await draft([{productId:p.id,quantity:3}]);
  const results=await Promise.allSettled([challans.confirm(c.id,actor),challans.confirm(c.id,actor)]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await stock(p.id)).toBe(7);expect(await logs(p.id)).toHaveLength(1);
});
it('competing drafts cannot oversell shared stock',async()=>{
  const p=await product();const a=await draft([{productId:p.id,quantity:7}]),b=await draft([{productId:p.id,quantity:7}]);
  const results=await Promise.allSettled([challans.confirm(a.id,actor),challans.confirm(b.id,actor)]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await stock(p.id)).toBe(3);expect(await logs(p.id)).toHaveLength(1);
});
it('cancel and confirm racing produce one terminal state',async()=>{
  const p=await product();const c=await draft([{productId:p.id,quantity:2}]);
  const results=await Promise.allSettled([challans.cancel(c.id),challans.confirm(c.id,actor)]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const final=await challans.detail(c.id);expect(await stock(p.id)).toBe(final.status==='CONFIRMED'?8:10);
});
it('cancelled drafts cannot be confirmed',async()=>{
  const p=await product();const c=await draft([{productId:p.id,quantity:2}]);await challans.cancel(c.id);
  await expect(challans.confirm(c.id,actor)).rejects.toMatchObject({status:409});expect(await stock(p.id)).toBe(10);
});
it('rejects malformed quantities and duplicate lines',async()=>{
  const p=await product();for(const items of [[],[{productId:p.id,quantity:0}],[{productId:p.id,quantity:1.5}],[{productId:p.id,quantity:1},{productId:p.id,quantity:1}]]) {
    expect((await request(app).post('/api/challans').auth(token(),{type:'bearer'}).send({customerId,items})).status).toBe(400);
  }
});
it('protects endpoints and lists drafts with pagination',async()=>{
  expect((await request(app).get('/api/challans')).status).toBe(401);
  const r=await request(app).get('/api/challans').auth(token(),{type:'bearer'}).query({status:'DRAFT',limit:1});expect(r.status).toBe(200);expect(r.body.data.challans.length).toBeLessThanOrEqual(1);
});

it('enforces challan read and write roles on the backend',async()=>{
  const p=await product();
  for(const role of ['ADMIN','SALES','WAREHOUSE','ACCOUNTS'] as const){
    await prisma.user.update({where:{id:actor},data:{role}});
    expect((await request(app).get('/api/challans').auth(token(),{type:'bearer'})).status).toBe(200);
    const response=await request(app).post('/api/challans').auth(token(),{type:'bearer'}).send({customerId,items:[{productId:p.id,quantity:1}]});
    if(role==='ADMIN'||role==='SALES'){
      expect(response.status).toBe(201);const id=response.body.data.challan.id;challanIds.push(id);
      expect((await request(app).post(`/api/challans/${id}/confirm`).auth(token(),{type:'bearer'})).status).toBe(200);
    }else{
      expect(response.status).toBe(403);
      expect((await request(app).post(`/api/challans/${challanIds[0]}/confirm`).auth(token(),{type:'bearer'})).status).toBe(403);
    }
  }
  await prisma.user.update({where:{id:actor},data:{role:'SALES'}});
});
