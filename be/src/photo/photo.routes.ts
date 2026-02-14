import { Router } from 'express';
import { ProductPhotoController } from './productPhoto/productPhoto.controller.js';
import { UserPhotoController } from './userPhoto/userPhoto.controller.js';
import { uploadProduct, uploadProfile } from './multer.config.js';
import { verifyToken, verifyRole } from '../shared/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';

export const photoRouter = Router();

// --- Rutas de Producto (Solo Admin) ---
photoRouter.post('/upload/productPhotos/:id', verifyToken, verifyRole([UserRole.ADMIN]), uploadProduct.array('files', 10), ProductPhotoController.uploadProductPhotos);
photoRouter.post('/reorder', verifyToken, verifyRole([UserRole.ADMIN]), ProductPhotoController.reorderProductPhotos);
photoRouter.delete('/productPhotos/:photoId', verifyToken, verifyRole([UserRole.ADMIN]), ProductPhotoController.deleteProductPhoto);

// --- Rutas de Usuario (Usuario logueado) ---
// TODO: Validar que el usuario solo pueda modificar su propia foto
photoRouter.post('/upload/userPhoto/:id', verifyToken, uploadProfile.single('file'), UserPhotoController.uploadUserPhoto);
photoRouter.delete('/userPhoto/:photoId', verifyToken, UserPhotoController.deleteUserPhoto);
