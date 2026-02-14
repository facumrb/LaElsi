import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { User } from '../../user/user.entity.js';
import { UserPhoto } from './userPhoto.entity.js';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';

const USERS_PATH = path.join(process.cwd(), 'uploads', 'users');

export class UserPhotoController {
  static uploadUserPhoto = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const file = req.file;
    const id = Number(req.params.id);

    if (isNaN(id)) throw new AppError('ID de Usuario inválido', 400);

    try {
      // Validación de que el usuario solo pueda modificar su propia foto (a menos que sea un admin)
      const isOwner = req.user?.id === id;
      const isAdmin = req.user?.role === 'Admin';

      if (!isOwner && !isAdmin) {
        if (file) await UserPhotoController.deleteUserUploadedFile(file);
        throw new AppError('No tienes permisos para modificar esta foto', 403);
      }

      if (!file) {
        throw new AppError('No se envió ninguna imagen', 400);
      }

      const maxFileSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxFileSize) {
        await UserPhotoController.deleteUserUploadedFile(file);
        throw new AppError('La imagen excede el límite de 2MB', 400);
      }

      // Buscamos el usuario
      const user = await em.findOne(User, { id });
      if (!user) {
        await UserPhotoController.deleteUserUploadedFile(file);
        throw new AppError('El usuario no existe', 404);
      }

      // Buscamos si ya tiene foto de perfil
      let userPhoto = await em.findOne(UserPhoto, { user });

      // Si existe, borramos el archivo anterior y actualizamos la entidad. Si no, creamos una nueva.
      if (userPhoto) {
        const oldFilePath = path.join(USERS_PATH, userPhoto.fileName);
        try {
          await fs.unlink(oldFilePath);
        } catch (e) {
          console.warn('No se pudo borrar foto anterior:', userPhoto.fileName);
        }

        // Actualizamos entidad
        userPhoto.fileName = file.filename;
        userPhoto.originalName = file.originalname;
        userPhoto.mimeType = file.mimetype;
      } else {
        // Crear nueva entidad
        userPhoto = new UserPhoto();
        userPhoto.fileName = file.filename;
        userPhoto.originalName = file.originalname;
        userPhoto.mimeType = file.mimetype;
        userPhoto.user = user;
        em.persist(userPhoto);
      }

      user.updatedAt = new Date();
      await em.flush();

      return res.status(201).json(ApiResponse.created('Foto de perfil actualizada correctamente', {
        fileName: userPhoto.fileName,
        id: userPhoto.id
      }));

    } catch (error: any) {
      if (file) await UserPhotoController.deleteUserUploadedFile(file);
      throw error;
    }
  });

  static deleteUserPhoto = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const photoId = Number(req.params.photoId);
    if (isNaN(photoId)) throw new AppError('ID de foto inválido', 400);

    const photo = await em.findOne(UserPhoto, { id: photoId });

    if (!photo) {
      throw new AppError('Foto no encontrada', 404);
    }

    const userId = photo.user.id;

    // Validar que el usuario solo pueda eliminar su propia foto (a menos que sea un admin)
    const isOwner = req.user?.id === userId;
    const isAdmin = req.user?.role === 'Admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('No tienes permisos para eliminar esta foto', 403);
    }

    const filePath = path.join(USERS_PATH, photo.fileName);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn(`No se pudo borrar el archivo físico: ${err}`);
    }

    await em.nativeUpdate(User, { id: userId }, { updatedAt: new Date() });
    em.remove(photo);
    await em.flush();

    return res.status(200).json(ApiResponse.success('Foto de perfil eliminada'));
  });

  private static async deleteUserUploadedFile(file: Express.Multer.File) {
    try {
      await fs.unlink(file.path);
    } catch (e) {
      console.warn('No se pudo borrar archivo temporal:', file.filename);
    }
  }
}
