import { Router } from 'express';
import { login, register, refreshToken } from './user.controller.js';
import { loginLimiter } from '../shared/middlewares/rateLimiter.js';

export const userRouter = Router();

userRouter.post('/login', loginLimiter, login);
userRouter.post('/register', register);
userRouter.post('/refresh-token', refreshToken);
