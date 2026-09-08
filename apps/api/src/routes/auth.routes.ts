import { Router } from 'express';
import { loginController, meController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const authRouter = Router();
authRouter.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
authRouter.post('/login', loginController);
authRouter.get('/me', authenticate, meController);
