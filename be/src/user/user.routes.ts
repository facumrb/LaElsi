import { Router } from 'express';
import { login, register, refreshToken, verifyPassword } from './user.controller.js';
import { loginLimiter } from '../shared/middlewares/rateLimiter.js';
import { verifyToken } from '../shared/middlewares/auth.middleware.js';

export const userRouter = Router();

userRouter.post('/login', loginLimiter, login);
userRouter.post('/register', register);
userRouter.post('/refresh-token', refreshToken);
userRouter.post('/verify-password', verifyToken, verifyPassword);

export default userRouter;
