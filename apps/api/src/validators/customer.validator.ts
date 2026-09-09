import { z } from 'zod';
import { CustomerStatus, CustomerType } from '@prisma/client';

const date = z.union([z.string().date(), z.string().datetime({ offset: true })])
  .transform((value) => new Date(value)).nullable().optional();
const customerFields = z.object({
  customerName: z.string().trim().min(1).max(200),
  mobileNumber: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Use 7–15 digits, optionally prefixed with +'),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  businessName: z.string().trim().min(1).max(200),
  gstNumber: z.string().trim().regex(/^[a-zA-Z0-9]{15}$/, 'Use a 15-character alphanumeric GST number')
    .transform((value) => value.toUpperCase()).nullable().optional(),
  customerType: z.nativeEnum(CustomerType),
  address: z.string().trim().min(1).max(2000),
  status: z.nativeEnum(CustomerStatus),
  followUpDate: date,
  notes: z.string().trim().max(10000).nullable().optional(),
}).strict();

export const createCustomerSchema = customerFields;
export const updateCustomerSchema = customerFields.partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one customer field');
export const customerParamsSchema = z.object({ id: z.string().cuid() }).strict();
const positiveQueryInteger = (fallback: string, maximum: number) => z.string().regex(/^[1-9]\d*$/)
  .default(fallback).transform(Number).pipe(z.number().int().max(maximum));
export const customerQuerySchema = z.object({
  page: positiveQueryInteger('1', 1000000),
  limit: positiveQueryInteger('20', 100),
  search: z.string().trim().max(200).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
}).strict();
export const followUpSchema = z.object({
  note: z.string().trim().min(1).max(10000),
  followUpDate: date,
}).strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;
