import { Router } from 'express';
import { sanitizeClientInput, findAll, findOne, searchClientByText, add, update, remove, getAccountInfo } from './client.controller.js';
import { verifyToken, verifyRole } from '../../shared/auth.middleware.js';
import { UserRole } from '../user.entity.js';

export const clientRouter = Router();

// Rutas protegidas (Admin puede gestionar clientes)
clientRouter.get('/', verifyToken, verifyRole([UserRole.ADMIN]), findAll);
clientRouter.get('/:id', verifyToken, verifyRole([UserRole.ADMIN]), findOne);
clientRouter.get('/search', verifyToken, verifyRole([UserRole.ADMIN]), searchClientByText);
clientRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeClientInput, add);
clientRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), remove);
clientRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN, UserRole.CLIENT]), sanitizeClientInput, update);

// Usuario logueado puede ver su propia cuenta
clientRouter.get('/account/:id', verifyToken, getAccountInfo);
