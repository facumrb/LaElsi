import { Router } from 'express';
import { ProductPhotoController } from './productPhoto/productPhoto.controller.js';
import { UserPhotoController } from './userPhoto/userPhoto.controller.js';
import { uploadProduct, uploadProfile } from './multer.config.js';
import { verifyToken, verifyRole } from '../shared/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';
import { optimizeImage } from './imageOptimizer.middleware.js';

export const photoRouter = Router();

// --- Rutas de Producto (Solo Admin) ---
photoRouter.post('/upload/productPhotos/:id', verifyToken, verifyRole([UserRole.Admin]), uploadProduct.array('files', 10), optimizeImage('products'), ProductPhotoController.uploadProductPhotos);
photoRouter.post('/reorder', verifyToken, verifyRole([UserRole.Admin]), ProductPhotoController.reorderProductPhotos);
photoRouter.delete('/productPhotos/:photoId', verifyToken, verifyRole([UserRole.Admin]), ProductPhotoController.deleteProductPhoto);

// --- Rutas de Usuario (Usuario logueado) ---
// TODO: Validar que el usuario solo pueda modificar su propia foto
photoRouter.post('/upload/userPhoto/:id', verifyToken, uploadProfile.single('file'), optimizeImage('users'), UserPhotoController.uploadUserPhoto);
photoRouter.delete('/userPhoto/:photoId', verifyToken, UserPhotoController.deleteUserPhoto);
