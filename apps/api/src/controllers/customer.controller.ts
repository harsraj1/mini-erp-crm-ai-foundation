import type { RequestHandler } from 'express';
import { createCustomerSchema, updateCustomerSchema, customerParamsSchema, customerQuerySchema, followUpSchema } from '../validators/customer.validator.js';
import * as customers from '../services/customer.service.js';
import { AppError } from '../utils/app-error.js';

export const listCustomers: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await customers.listCustomers(customerQuerySchema.parse(req.query)) });
};
export const createCustomer: RequestHandler = async (req, res) => {
  const customer = await customers.createCustomer(createCustomerSchema.parse(req.body));
  res.status(201).json({ success: true, data: { customer } });
};
export const getCustomer: RequestHandler = async (req, res) => {
  const { id } = customerParamsSchema.parse(req.params);
  res.json({ success: true, data: { customer: await customers.getCustomer(id) } });
};
export const updateCustomer: RequestHandler = async (req, res) => {
  const { id } = customerParamsSchema.parse(req.params);
  const customer = await customers.updateCustomer(id, updateCustomerSchema.parse(req.body));
  res.json({ success: true, data: { customer } });
};
export const addFollowUp: RequestHandler = async (req, res) => {
  const { id } = customerParamsSchema.parse(req.params);
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required');
  const followUp = await customers.addFollowUp(id, req.user.id, followUpSchema.parse(req.body));
  res.status(201).json({ success: true, data: { followUp } });
};
