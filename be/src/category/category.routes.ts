import { Router } from 'express';
import { CategoryController, sanitizeCategoryInput } from './category.controller.js';
import { verifyToken, verifyRole } from '../shared/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const categoryRouter = Router();

// Rutas públicas (cualquier usuario puede ver categorías)
categoryRouter.get('/search', CategoryController.searchCategoriesByText);
categoryRouter.get('/active', CategoryController.findAllActive);
categoryRouter.get('/tree', CategoryController.getTree);
categoryRouter.get('/:id/children', CategoryController.getChildren);
categoryRouter.get('/', CategoryController.findAll);
categoryRouter.get('/:id', CategoryController.findOne);

// Rutas protegidas (solo Admin puede crear/editar/eliminar)
categoryRouter.post('/', verifyToken, verifyRole([UserRole.Admin]), sanitizeCategoryInput, CategoryController.add);
categoryRouter.patch('/:id', verifyToken, verifyRole([UserRole.Admin]), sanitizeCategoryInput, CategoryController.update);
categoryRouter.delete('/:id', verifyToken, verifyRole([UserRole.Admin]), CategoryController.remove);
