import { Router } from 'express';
import { sanitizeClientInput, findAll, findOne, add, update, remove, getAccountInfo } from './client.controler.js';
import { login } from '../user.controler.js';
import { verifyToken, verifyRole } from '../../shared/auth.middleware.js';
import { UserRole } from '../user.entity.js';

export const clientRouter = Router();

// Ruta pública
clientRouter.post('/login', login);

// Rutas protegidas (Admin puede gestionar clientes)
clientRouter.get('/', verifyToken, verifyRole([UserRole.ADMIN]), findAll);
clientRouter.get('/:id', verifyToken, verifyRole([UserRole.ADMIN]), findOne);
clientRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeClientInput, add);
clientRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), remove);
clientRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeClientInput, update);

// Usuario logueado puede ver su propia cuenta
clientRouter.get('/account/:id', verifyToken, getAccountInfo);
