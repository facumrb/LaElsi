import { Router } from 'express';
import { login, register } from './user.controler.js';

export const userRouter = Router();

userRouter.post('/login', login);
userRouter.post('/register', register);
