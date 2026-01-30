import { Router } from 'express';
import { sanitizeProductInput, findAll, findOne, add, update, remove, searchProductsByText, findProductsByCategory /* imagenProducto, cargaImagenes, uploadDir */ } from './product.controler.js';

export const productRouter = Router();

// No se usan:
productRouter.get('/', findAll);

// Se usan:
productRouter.post('/', sanitizeProductInput, add);
productRouter.patch('/:id', sanitizeProductInput, update);
productRouter.delete('/:id', remove);
// productRouter.post("/", imagenProducto.single("foto"), sanitizeProductInput, add); ???
productRouter.get('/search', searchProductsByText); // Buscar productos por texto
productRouter.get('/category/:categoryName', findProductsByCategory); // Obtener productos por categoría
productRouter.get('/:id', findOne);
// Ruta para manejar la carga de imágenes
/* productRouter.post("/imagenesProductos/multi", imagenProducto, cargaImagenes);
 */
