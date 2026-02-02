import { Router } from 'express';
import { uploadPhotos, reorderPhotos, deletePhoto } from './photo.controler.js';
import { upload } from '../shared/multer.config.js';

export const photoRouter = Router();

// Subir Fotos (Recibe Multipart, usa Multer)
photoRouter.post('/upload/:id', upload.array('files', 10), uploadPhotos);
// 'files' es el nombre del campo en el FormData en el front, 10 es el máximo

photoRouter.post('/reorder', reorderPhotos);

// Ruta para borrar una foto específica
photoRouter.delete('/:photoId', deletePhoto);
