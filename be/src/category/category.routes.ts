import { Router } from 'express';
import { findAll, findOne, add, update, remove, searchCategoriesByText, sanitizeCategoryInput } from './category.controller.js';
import { verifyToken, verifyRole } from '../shared/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const categoryRouter = Router();

// Rutas públicas (cualquier usuario puede ver categorías)
categoryRouter.get('/search', searchCategoriesByText);
categoryRouter.get('/', findAll);
categoryRouter.get('/:id', findOne);

// Rutas protegidas (solo Admin puede crear/editar/eliminar)
categoryRouter.post('/', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeCategoryInput, add);
categoryRouter.patch('/:id', verifyToken, verifyRole([UserRole.ADMIN]), sanitizeCategoryInput, update);
categoryRouter.delete('/:id', verifyToken, verifyRole([UserRole.ADMIN]), remove);
