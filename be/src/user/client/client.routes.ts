import { Router } from 'express';
import { ClientController } from './client.controller.js';
import { sanitizeClientInput } from '../../shared/middlewares/client.middleware.js';
import { verifyToken, verifyRole } from '../../shared/middlewares/auth.middleware.js';
import { UserRole } from '../user.entity.js';

export const clientRouter = Router();

// Rutas protegidas (Admin puede gestionar clientes)
clientRouter.get('/', verifyToken, verifyRole([UserRole.Admin]), ClientController.findAll);
clientRouter.get('/search', verifyToken, verifyRole([UserRole.Admin]), ClientController.searchClientByText);

// Usuario logueado puede ver su propia cuenta
clientRouter.get('/account/:id', verifyToken, ClientController.getAccountInfo);

// Rutas protegidas (Admin puede gestionar clientes)
clientRouter.get('/:id', verifyToken, verifyRole([UserRole.Admin]), ClientController.findOne);
clientRouter.post('/', verifyToken, verifyRole([UserRole.Admin]), sanitizeClientInput, ClientController.add);
clientRouter.delete('/:id', verifyToken, verifyRole([UserRole.Admin]), ClientController.remove);
clientRouter.patch('/:id', verifyToken, verifyRole([UserRole.Admin, UserRole.Client]), sanitizeClientInput, ClientController.update);
