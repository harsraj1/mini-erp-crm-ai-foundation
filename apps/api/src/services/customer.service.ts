import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/app-error.js';
import { safeUserSelect } from './auth.service.js';
import type { CreateCustomerInput, UpdateCustomerInput, CustomerQuery, FollowUpInput } from '../validators/customer.validator.js';

const notFound = () => new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
const followUpInclude = { createdBy: { select: safeUserSelect } } satisfies Prisma.CustomerFollowUpInclude;

export async function listCustomers(query: CustomerQuery) {
  // Treat SQL LIKE wildcard characters as literal search text.
  const search = query.search?.replace(/[\\%_]/g, '\\$&');
  const where: Prisma.CustomerWhereInput = {
    status: query.status,
    customerType: query.customerType,
    ...(search ? { OR: ['customerName', 'mobileNumber', 'email', 'businessName'].map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    })) } : {}),
  };
  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
    prisma.customer.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  return { customers, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
}

export function createCustomer(data: CreateCustomerInput) {
  return prisma.customer.create({ data });
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id }, include: {
    followUps: { include: followUpInclude, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
  } });
  if (!customer) throw notFound();
  return customer;
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  try {
    return await prisma.customer.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw notFound();
    throw error;
  }
}

export async function addFollowUp(customerId: string, createdById: string, data: FollowUpInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Lock/update the customer and insert its history in one atomic operation.
      // Omitting the date preserves the current schedule; explicit null clears it.
      await tx.customer.update({ where: { id: customerId }, data: {
        followUpDate: data.followUpDate, updatedAt: new Date(),
      }, select: { id: true } });
      return tx.customerFollowUp.create({ data: { ...data, customerId, createdById }, include: followUpInclude });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw notFound();
    throw error;
  }
}
