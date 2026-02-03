import { Router } from 'express';
import { login, register } from './user.controller.js';

export const userRouter = Router();

userRouter.post('/login', login);
userRouter.post('/register', register);
