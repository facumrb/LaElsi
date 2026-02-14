import { Router } from 'express';
import { AdminController, sanitizeAdminInput } from './admin.controller.js';
import { verifyToken, verifyRole } from '../../shared/auth.middleware.js';
import { UserRole } from '../user.entity.js';

export const adminRouter = Router();

// Rutas protegidas (solo Admin puede gestionar admins)
adminRouter.get('/', verifyToken, verifyRole([UserRole.ADMIN]), AdminController.findAll);
adminRouter.get('/:id', verifyToken, verifyRole([UserRole.ADMIN]), AdminController.findOne);
adminRouter.get('/search', verifyToken, verifyRole([UserRole.ADMIN]), AdminController.searchAdminByText);
adminRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeAdminInput, AdminController.add);
adminRouter.get('/account/:id', verifyToken, AdminController.getAccountInfo);
adminRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), AdminController.remove);
adminRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeAdminInput, AdminController.update);
