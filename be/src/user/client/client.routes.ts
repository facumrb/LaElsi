import { Router } from 'express';
import { ClientController, sanitizeClientInput } from './client.controller.js';
import { verifyToken, verifyRole } from '../../shared/auth.middleware.js';
import { UserRole } from '../user.entity.js';

export const clientRouter = Router();

// Rutas protegidas (Admin puede gestionar clientes)
clientRouter.get('/', verifyToken, verifyRole([UserRole.ADMIN]), ClientController.findAll);
clientRouter.get('/:id', verifyToken, verifyRole([UserRole.ADMIN]), ClientController.findOne);
clientRouter.get('/search', verifyToken, verifyRole([UserRole.ADMIN]), ClientController.searchClientByText);
clientRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeClientInput, ClientController.add);
clientRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), ClientController.remove);
clientRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN, UserRole.CLIENT]), sanitizeClientInput, ClientController.update);

// Usuario logueado puede ver su propia cuenta
clientRouter.get('/account/:id', verifyToken, ClientController.getAccountInfo);
