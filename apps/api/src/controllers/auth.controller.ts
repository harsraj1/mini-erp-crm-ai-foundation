import type { RequestHandler } from 'express';
import { loginSchema } from '../validators/auth.validator.js';
import { login } from '../services/auth.service.js';

export const loginController: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  res.json({ success: true, data: await login(input.email, input.password) });
};
export const meController: RequestHandler = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};
