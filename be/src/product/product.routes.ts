import { Router } from 'express';
import { sanitizeProductInput, findAll, findOne, add, update, remove, searchProductsByText, findProductsByCategory } from './product.controler.js';

export const productRouter = Router();

productRouter.get('/', findAll);
productRouter.patch('/:id', sanitizeProductInput, update);
productRouter.delete('/:id', remove);
productRouter.get('/search', searchProductsByText);
productRouter.get('/category/:categoryName', findProductsByCategory);
productRouter.get('/:id', findOne);

// Crear Producto (Solo recibe JSON para el sanitize, las fotos se manejan aparte)
productRouter.post('/', sanitizeProductInput, add);
