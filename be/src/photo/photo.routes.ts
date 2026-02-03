import { Router } from 'express';
import { uploadProductPhotos, reorderProductPhotos, deleteProductPhoto } from './productPhoto/productPhoto.controller.js';
import { uploadUserPhoto, deleteUserPhoto } from './userPhoto/userPhoto.controller.js';
import { upload } from '../shared/multer.config.js';
import { verifyToken, verifyRole } from '../shared/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const photoRouter = Router();

// --- Rutas de Producto (Solo Admin) ---
photoRouter.post('/upload/productPhotos/:id', verifyToken, verifyRole([UserRole.ADMIN]), upload.array('files', 10), uploadProductPhotos);
photoRouter.post('/reorder', verifyToken, verifyRole([UserRole.ADMIN]), reorderProductPhotos);
photoRouter.delete('/productPhotos/:photoId', verifyToken, verifyRole([UserRole.ADMIN]), deleteProductPhoto);

// --- Rutas de Usuario (Usuario logueado) ---
// TODO: Validar que el usuario solo pueda modificar su propia foto
photoRouter.post('/upload/userPhoto/:id', verifyToken, upload.single('file'), uploadUserPhoto);
photoRouter.delete('/userPhoto/:photoId', verifyToken, deleteUserPhoto);
