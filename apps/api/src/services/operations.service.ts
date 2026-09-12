import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/app-error.js';
import { safeUserSelect } from './auth.service.js';
import type { AdjustmentInput, BalanceInput, OrderInput, PageQuery, TransferInput, WorkInput } from '../validators/operations.validator.js';

export const inventoryRoles: Role[] = [Role.ADMIN, Role.OPERATIONS, Role.WAREHOUSE];
const balanceInclude = { item:true, location:true } satisfies Prisma.InventoryBalanceInclude;
const missing = () => new AppError(404,'NOT_FOUND','The requested record was not found');
const insufficient = () => new AppError(409,'INSUFFICIENT_STOCK','Requested quantity exceeds available stock');
const invalidState = () => new AppError(409,'INVALID_STATE','This operation is not allowed in the current state');
const available = <T extends {physicalQuantity:number;reservedQuantity:number}>(b:T) => ({...b, availableQuantity:b.physicalQuantity-b.reservedQuantity});
const paging = (q:PageQuery) => ({skip:(q.page-1)*q.limit,take:q.limit});
const pagination = (q:PageQuery,total:number) => ({page:q.page,limit:q.limit,total,totalPages:Math.ceil(total/q.limit)});

// Unique request IDs roll back the whole command on duplicate delivery.
async function transaction<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T> {
  try { return await prisma.$transaction(fn); }
  catch(e) {
    if(e instanceof Prisma.PrismaClientKnownRequestError) {
      if(e.code==='P2002') throw new AppError(409,'DUPLICATE_REQUEST','This request or record already exists. Refresh before retrying.');
      if(e.code==='P2003'||e.code==='P2025') throw missing();
    }
    throw e;
  }
}
async function lockBalance(tx:Prisma.TransactionClient,id:string) {
  await tx.$queryRaw`SELECT id FROM "InventoryBalance" WHERE id=${id} FOR UPDATE`;
  const balance=await tx.inventoryBalance.findUnique({where:{id},include:balanceInclude});
  if(!balance) throw missing();
  return balance;
}
function checkIncrease(current:number,increment:number) {
  if(current+increment>2147483647) throw new AppError(400,'VALIDATION_ERROR','Quantity exceeds supported storage limit');
}
export async function catalog() {
  const [items,locations]=await Promise.all([prisma.item.findMany({orderBy:{name:'asc'}}),prisma.location.findMany({orderBy:{name:'asc'}})]);
  return {items,locations};
}
export function assignees() {
  return prisma.user.findMany({where:{role:{in:inventoryRoles}},select:safeUserSelect,orderBy:{name:'asc'}});
}
export function createItem(data:Prisma.ItemCreateInput) {return transaction(tx=>tx.item.create({data}));}
export function createLocation(data:{name:string}) {return transaction(tx=>tx.location.create({data}));}
export async function inventory(q:PageQuery) {
  const where:Prisma.InventoryBalanceWhereInput=q.search?{OR:[{item:{name:{contains:q.search,mode:'insensitive'}}},{item:{code:{contains:q.search,mode:'insensitive'}}},{location:{name:{contains:q.search,mode:'insensitive'}}},{batch:{contains:q.search,mode:'insensitive'}}]}:{};
  const [rows,total]=await prisma.$transaction([prisma.inventoryBalance.findMany({where,...paging(q),include:balanceInclude,orderBy:{id:'asc'}}),prisma.inventoryBalance.count({where})]);
  return {rows:rows.map(available),pagination:pagination(q,total)};
}
export function createBalance(input:BalanceInput,actor:string) {
  return transaction(async tx=>{
    const {requestId,...data}=input;
    const b=await tx.inventoryBalance.create({data,include:balanceInclude});
    await tx.inventoryEvent.create({data:{requestId,balanceId:b.id,physicalChange:b.physicalQuantity,reservedChange:0,reason:'Opening balance',createdById:actor}});
    return available(b);
  });
}
export function adjust(id:string,input:AdjustmentInput,actor:string) {
  return transaction(async tx=>{
    const b=await lockBalance(tx,id);
    if(input.direction==='OUT'&&input.quantity>b.physicalQuantity-b.reservedQuantity) throw insufficient();
    const delta=input.direction==='IN'?input.quantity:-input.quantity;
    checkIncrease(b.physicalQuantity,delta);
    const updated=await tx.inventoryBalance.update({where:{id},data:{physicalQuantity:{increment:delta}},include:balanceInclude});
    await tx.inventoryEvent.create({data:{requestId:input.requestId,balanceId:id,physicalChange:delta,reservedChange:0,reason:input.reason,createdById:actor}});
    return available(updated);
  });
}
export async function history(id:string,q:PageQuery) {
  if(!await prisma.inventoryBalance.findUnique({where:{id}})) throw missing();
  const where={balanceId:id};
  const [rows,total]=await prisma.$transaction([prisma.inventoryEvent.findMany({where,...paging(q),include:{createdBy:{select:safeUserSelect}},orderBy:[{createdAt:'desc'},{id:'desc'}]}),prisma.inventoryEvent.count({where})]);
  return {rows,pagination:pagination(q,total)};
}
export function createWork(input:WorkInput,actor:string) {
  return transaction(async tx=>{
    const user=await tx.user.findUnique({where:{id:input.assignedUserId}});
    if(!user||!inventoryRoles.includes(user.role)) throw new AppError(400,'INVALID_ASSIGNEE','Assign an Admin or Operations user');
    return tx.workOrder.create({data:{...input,createdById:actor}});
  });
}
export async function workOrders(q:PageQuery) {
  const [rows,total]=await prisma.$transaction([prisma.workOrder.findMany({...paging(q),include:{item:true,location:true,assignedUser:{select:safeUserSelect}},orderBy:[{createdAt:'desc'},{id:'desc'}]}),prisma.workOrder.count()]);
  const result=await Promise.all(rows.map(async w=>{
    const balances=await prisma.inventoryBalance.findMany({where:{itemId:w.itemId},include:{location:true}});
    const local=balances.filter(b=>b.locationId===w.locationId).reduce((sum,b)=>sum+b.physicalQuantity-b.reservedQuantity,0);
    return {...w,availableQuantity:local,shortage:Math.max(0,w.requiredQuantity-local),alternatives:balances.filter(b=>b.locationId!==w.locationId&&b.physicalQuantity>b.reservedQuantity).map(available)};
  }));
  return {rows:result,pagination:pagination(q,total)};
}
export function changeWorkStatus(id:string,status:'IN_PROGRESS'|'COMPLETED',actor:{id:string;role:Role}) {
  return transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "WorkOrder" WHERE id=${id} FOR UPDATE`;
    const w=await tx.workOrder.findUnique({where:{id}});if(!w)throw missing();
    if(actor.role!==Role.ADMIN&&w.assignedUserId!==actor.id)throw new AppError(403,'FORBIDDEN','Only the assigned user or Admin can update this work order');
    if((status==='IN_PROGRESS'&&w.status!=='ASSIGNED')||(status==='COMPLETED'&&w.status!=='IN_PROGRESS'))throw invalidState();
    return tx.workOrder.update({where:{id},data:{status}});
  });
}
export function requestTransfer(input:TransferInput,actor:string) {
  return transaction(async tx=>{
    const b=await lockBalance(tx,input.sourceBalanceId);
    if(b.locationId===input.destinationLocationId)throw new AppError(400,'VALIDATION_ERROR','Choose a different destination location');
    if(input.quantity>b.physicalQuantity-b.reservedQuantity)throw insufficient();
    return tx.internalTransfer.create({data:{...input,createdById:actor}});
  });
}
export async function transfers(q:PageQuery) {
  const [rows,total]=await prisma.$transaction([prisma.internalTransfer.findMany({...paging(q),include:{sourceBalance:{include:balanceInclude},destinationLocation:true},orderBy:[{createdAt:'desc'},{id:'desc'}]}),prisma.internalTransfer.count()]);
  return {rows,pagination:pagination(q,total)};
}
export function advanceTransfer(id:string,action:'dispatch'|'receive',actor:string) {
  return transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "InternalTransfer" WHERE id=${id} FOR UPDATE`;
    const t=await tx.internalTransfer.findUnique({where:{id},include:{sourceBalance:true}});if(!t)throw missing();
    if(action==='dispatch') {
      if(t.status!=='REQUESTED')throw invalidState();
      const b=await lockBalance(tx,t.sourceBalanceId);
      if(t.quantity>b.physicalQuantity-b.reservedQuantity)throw insufficient();
      await tx.inventoryBalance.update({where:{id:b.id},data:{physicalQuantity:{decrement:t.quantity}}});
      await tx.inventoryEvent.create({data:{requestId:`dispatch:${id}`,balanceId:b.id,physicalChange:-t.quantity,reservedChange:0,reason:`Transfer ${id} dispatched`,createdById:actor}});
      return tx.internalTransfer.update({where:{id},data:{status:'DISPATCHED',dispatchedAt:new Date()}});
    }
    if(t.status!=='DISPATCHED')throw invalidState();
    // The compound unique key serializes competing first receipts into a new batch.
    const dest=await tx.inventoryBalance.upsert({where:{itemId_locationId_batch:{itemId:t.sourceBalance.itemId,locationId:t.destinationLocationId,batch:t.sourceBalance.batch}},create:{itemId:t.sourceBalance.itemId,locationId:t.destinationLocationId,batch:t.sourceBalance.batch},update:{physicalQuantity:{increment:0}}});
    const locked=await lockBalance(tx,dest.id);checkIncrease(locked.physicalQuantity,t.quantity);
    await tx.inventoryBalance.update({where:{id:dest.id},data:{physicalQuantity:{increment:t.quantity}}});
    await tx.inventoryEvent.create({data:{requestId:`receive:${id}`,balanceId:dest.id,physicalChange:t.quantity,reservedChange:0,reason:`Transfer ${id} received`,createdById:actor}});
    return tx.internalTransfer.update({where:{id},data:{status:'RECEIVED',receivedAt:new Date()}});
  });
}
export function reserveOrder(input:OrderInput,actor:string) {
  return transaction(async tx=>{
    const b=await lockBalance(tx,input.balanceId);
    if(input.quantity>b.physicalQuantity-b.reservedQuantity)throw insufficient();
    const order=await tx.customerOrder.create({data:{...input,createdById:actor}});
    await tx.inventoryBalance.update({where:{id:b.id},data:{reservedQuantity:{increment:input.quantity}}});
    await tx.inventoryEvent.create({data:{requestId:`reserve:${order.id}`,balanceId:b.id,physicalChange:0,reservedChange:input.quantity,reason:`Customer order ${order.id}`,createdById:actor}});
    return order;
  });
}
export async function orders(q:PageQuery) {
  const [rows,total]=await prisma.$transaction([prisma.customerOrder.findMany({...paging(q),include:{balance:{include:balanceInclude},createdBy:{select:safeUserSelect}},orderBy:[{createdAt:'desc'},{id:'desc'}]}),prisma.customerOrder.count()]);
  return {rows,pagination:pagination(q,total)};
}
