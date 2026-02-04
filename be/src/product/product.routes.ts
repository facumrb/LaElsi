import { Router } from 'express';
import { findPage, sanitizeProductInput, findAll, findAllActive, findOne, add, update, remove, searchProductsByText, findProductsByCategory } from './product.controller.js';
import { verifyToken, verifyRole } from '../shared/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const productRouter = Router();

// Rutas públicas (cualquier usuario puede ver productos)
productRouter.get('/', findAll);
productRouter.get('/active', findAllActive);
productRouter.get('/page', findPage);
productRouter.get('/search', searchProductsByText);
productRouter.get('/category/:categoryId', findProductsByCategory);
productRouter.get('/:id', findOne);

// Rutas protegidas (solo Admin puede crear/editar/eliminar)
productRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeProductInput, add);
productRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeProductInput, update);
productRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), remove);
