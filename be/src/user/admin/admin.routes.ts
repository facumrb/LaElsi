import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { sanitizeAdminInput } from '../../shared/middlewares/admin.middleware.js';
import { verifyToken, verifyRole } from '../../shared/middlewares/auth.middleware.js';
import { UserRole } from '../user.entity.js';

export const adminRouter = Router();

// Rutas protegidas (solo Admin puede gestionar admins)
adminRouter.get('/', verifyToken, verifyRole([UserRole.Admin]), AdminController.findAll);
adminRouter.get('/search', verifyToken, verifyRole([UserRole.Admin]), AdminController.searchAdminByText);
adminRouter.get('/account/:id', verifyToken, AdminController.getAccountInfo);
adminRouter.get('/:id', verifyToken, verifyRole([UserRole.Admin]), AdminController.findOne);
adminRouter.post('/', verifyToken, verifyRole([UserRole.Admin]), sanitizeAdminInput, AdminController.add);
adminRouter.delete('/:id', verifyToken, verifyRole([UserRole.Admin]), AdminController.remove);
adminRouter.patch('/:id', verifyToken, verifyRole([UserRole.Admin]), sanitizeAdminInput, AdminController.update);
