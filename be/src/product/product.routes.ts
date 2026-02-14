import { Router } from 'express';
import { ProductController, sanitizeProductInput } from './product.controller.js';
import { verifyToken, verifyRole } from '../shared/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const productRouter = Router();

// Rutas públicas (cualquier usuario puede ver productos)
productRouter.get('/', ProductController.findAll);
productRouter.get('/active', ProductController.findAllActive);
productRouter.get('/page', ProductController.findPage);
productRouter.get('/search', ProductController.searchProductsByText);
productRouter.get('/category/:categoryId', ProductController.findProductsByCategory);
productRouter.get('/:id', ProductController.findOne);

// Rutas protegidas (solo Admin puede crear/editar/eliminar)
productRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeProductInput, ProductController.add);
productRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeProductInput, ProductController.update);
productRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), ProductController.remove);
