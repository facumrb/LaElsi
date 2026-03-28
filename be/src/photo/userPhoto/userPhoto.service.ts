import { orm } from '../../shared/db/orm.js';
import { User } from '../../user/user.entity.js';
import { UserPhoto } from './userPhoto.entity.js';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '../../shared/errors/appError.js';

const USERS_PATH = path.join(process.cwd(), 'uploads', 'users');

export class UserPhotoService {
  static async uploadUserPhoto(id: number, file: Express.Multer.File | undefined, requestingUser: any) {
    const em = orm.em.fork();

    try {
      const isOwner = requestingUser?.id === id;
      const isAdmin = requestingUser?.role === 'Admin';

      if (!isOwner && !isAdmin) {
        if (file) await this.deleteUserUploadedFile(file);
        throw new AppError('No tienes permisos para modificar esta foto', 403);
      }

      if (!file) {
        throw new AppError('No se envió ninguna imagen', 400);
      }

      const maxFileSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxFileSize) {
        await this.deleteUserUploadedFile(file);
        throw new AppError('La imagen excede el límite de 2MB', 400);
      }

      const user = await em.findOne(User, { id });
      if (!user) {
        await this.deleteUserUploadedFile(file);
        throw new AppError('El usuario no existe', 404);
      }

      let userPhoto = await em.findOne(UserPhoto, { user });

      if (userPhoto) {
        const oldFilePath = path.join(USERS_PATH, userPhoto.fileName);
        try {
          await fs.unlink(oldFilePath);
        } catch (e) {
          console.warn('No se pudo borrar foto anterior:', userPhoto.fileName);
        }

        userPhoto.fileName = file.filename;
      } else {
        userPhoto = new UserPhoto();
        userPhoto.fileName = file.filename;
        userPhoto.user = user;
        em.persist(userPhoto);
      }

      user.updatedAt = new Date();
      await em.flush();

      return {
        fileName: userPhoto.fileName,
        id: userPhoto.id
      };
    } catch (error: any) {
      if (file) await this.deleteUserUploadedFile(file);
      throw error;
    }
  }

  static async deleteUserPhoto(photoId: number, requestingUser: any) {
    const em = orm.em.fork();

    const photo = await em.findOne(UserPhoto, { id: photoId });

    if (!photo) {
      throw new AppError('Foto no encontrada', 404);
    }

    const userId = photo.user.id;
    const isOwner = requestingUser?.id === userId;
    const isAdmin = requestingUser?.role === 'Admin';

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
  }

  private static async deleteUserUploadedFile(file: Express.Multer.File) {
    try {
      await fs.unlink(file.path);
    } catch (e) {
      console.warn('No se pudo borrar archivo temporal:', file.filename);
    }
  }
}
