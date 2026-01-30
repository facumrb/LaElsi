import { Router } from 'express';
import {
  sanitizeProductInput,
  findAll,
  findOne,
  add,
  uploadPhotos,
  update,
  remove,
  searchProductsByText,
  findProductsByCategory /* imagenProducto, cargaImagenes, uploadDir */
} from './product.controler.js';
import { upload } from '../shared/multer.config.js';

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

productRouter.post(
  '/:id/fotos',
  upload.array('fotos', 5), // 'fotos' es el nombre del campo en el FormData, 5 es el máximo
  uploadPhotos
);
