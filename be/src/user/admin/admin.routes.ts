import { Router } from 'express';
import { sanitizeAdminInput, findAll, findOne, add, update, remove, getAccountInfo } from './admin.controller.js';
import { login } from '../user.controller.js';
import { verifyToken, verifyRole } from '../../shared/auth.middleware.js';
import { UserRole } from '../user.entity.js';

export const adminRouter = Router();

// Ruta pública
adminRouter.post('/login', login);

// Rutas protegidas (solo Admin puede gestionar admins)
adminRouter.get('/', verifyToken, verifyRole([UserRole.ADMIN]), findAll);
adminRouter.get('/:id', verifyToken, verifyRole([UserRole.ADMIN]), findOne);
adminRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeAdminInput, add);
adminRouter.get('/account/:id', verifyToken, getAccountInfo);
adminRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), remove);
adminRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeAdminInput, update);
