import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.middleware.js';
import * as customers from '../controllers/customer.controller.js';

export const customerRouter = Router();
customerRouter.use(authenticate);
customerRouter.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const read = authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS);
const write = authorize(Role.ADMIN, Role.SALES);
customerRouter.get('/', read, customers.listCustomers);
customerRouter.post('/', write, customers.createCustomer);
customerRouter.get('/:id', read, customers.getCustomer);
customerRouter.patch('/:id', write, customers.updateCustomer);
customerRouter.post('/:id/follow-ups', write, customers.addFollowUp);
