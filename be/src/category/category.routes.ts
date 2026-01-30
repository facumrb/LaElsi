import { Router } from 'express';
import { findAll, findOne, add, update, remove, searchCategoriesByText, sanitizeCategoryInput } from './category.controler.js';

export const categoryRouter = Router();

categoryRouter.get('/search', searchCategoriesByText);
categoryRouter.get('/', findAll);
categoryRouter.get('/:name', findOne);
categoryRouter.post('/', sanitizeCategoryInput, add);
categoryRouter.patch('/:name', sanitizeCategoryInput, update);
categoryRouter.delete('/:name', remove);

// Ruta para buscar categorías por nombre o descripción
