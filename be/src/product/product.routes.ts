import { Router } from 'express';
import { sanitizeProductInput, findAll, findOne, add, uploadPhotos, reorderPhotos, update, remove, searchProductsByText, findProductsByCategory, deletePhoto } from './product.controler.js';
import { upload } from '../shared/multer.config.js';

export const productRouter = Router();

productRouter.get('/', findAll);
productRouter.patch('/:id', sanitizeProductInput, update);
productRouter.delete('/:id', remove);
productRouter.get('/search', searchProductsByText);
productRouter.get('/category/:categoryName', findProductsByCategory);
productRouter.get('/:id', findOne);

// PASO 1: Crear Producto (Recibe JSON, usa sanitize)
productRouter.post('/', sanitizeProductInput, add);

// PASO 2: Subir Fotos (Recibe Multipart, usa Multer)
productRouter.post('/:id/photos', upload.array('files', 10), uploadPhotos);
// 'files' es el nombre del campo en el FormData en el front, 10 es el máximo

productRouter.post('/photos/reorder', reorderPhotos);

// Ruta para borrar una foto específica
productRouter.delete('/photos/:photoId', deletePhoto);
