import { z } from 'zod';

const quantity = z.number().int().positive().max(2147483647);
const id = z.string().cuid();
const requestId = z.string().uuid();
export const operationId = z.object({ id });
export const pageQuery = z.object({
  page: z.coerce.number().int().positive().max(1000000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(100).optional(),
}).strict();
export const itemInput = z.object({ name:z.string().trim().min(1).max(200), code:z.string().trim().min(1).max(100).transform(s=>s.toUpperCase()), category:z.string().trim().min(1).max(100) }).strict();
export const locationInput = z.object({ name:z.string().trim().min(1).max(100) }).strict();
export const balanceInput = z.object({ requestId, itemId:id, locationId:id, batch:z.string().trim().min(1).max(100), physicalQuantity:z.number().int().nonnegative().max(2147483647) }).strict();
export const adjustmentInput = z.object({ requestId, quantity, direction:z.enum(['IN','OUT']), reason:z.string().trim().min(1).max(500) }).strict();
export const workInput = z.object({ requestId, itemId:id, locationId:id, requiredQuantity:quantity, assignedUserId:z.string().min(1).max(100) }).strict();
export const workStatusInput = z.object({ status:z.enum(['IN_PROGRESS','COMPLETED']) }).strict();
export const transferInput = z.object({ requestId, sourceBalanceId:id, destinationLocationId:id, quantity }).strict();
export const orderInput = z.object({ requestId, customerName:z.string().trim().min(1).max(200), balanceId:id, quantity }).strict();
export type PageQuery = z.infer<typeof pageQuery>;
export type BalanceInput = z.infer<typeof balanceInput>;
export type AdjustmentInput = z.infer<typeof adjustmentInput>;
export type WorkInput = z.infer<typeof workInput>;
export type TransferInput = z.infer<typeof transferInput>;
export type OrderInput = z.infer<typeof orderInput>;
