import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { User } from '../../user/user.entity.js';
import { UserPhoto } from './userPhoto.entity.js';
import path from 'path';
import fs from 'fs/promises';

const USERS_PATH = path.join(process.cwd(), 'uploads', 'users');

async function uploadUserPhoto(req: Request, res: Response) {
  const em = orm.em.fork();
  const file = req.file;

  try {
    const id = Number(req.params.id);

    if (!id) return res.status(400).json({ message: 'ID de Usuario inválido' });

    // Validación de que el usuario solo pueda modificar su propia foto
    if (req.user?.id !== id) {
      if (file) await deleteUserUploadedFile(file);
      return res.status(403).json({ message: 'No puedes modificar la foto de otro usuario' });
    }

    if (!file) {
      return res.status(400).json({ message: 'No se envió ninguna imagen' });
    }

    const maxFileSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxFileSize) {
      await deleteUserUploadedFile(file);
      return res.status(400).json({ message: 'La imagen excede el límite de 2MB' });
    }

    // Buscamos el usuario
    const user = await em.findOne(User, { id });
    if (!user) {
      await deleteUserUploadedFile(file);
      return res.status(404).json({ message: 'El usuario no existe' });
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

    await em.flush();

    return res.status(201).json({
      message: 'Foto de perfil actualizada correctamente',
      photo: {
        fileName: userPhoto.fileName,
        id: userPhoto.id
      }
    });
  } catch (error: any) {
    if (file) await deleteUserUploadedFile(file);
    return res.status(500).json({ message: 'Error interno: ' + error.message });
  }
}

async function deleteUserPhoto(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const photoId = Number(req.params.photoId);

    const photo = await em.findOneOrFail(UserPhoto, { id: photoId }, { populate: ['user'] });

    // Validar que el usuario solo pueda eliminar su propia foto
    if (req.user?.id !== photo.user.id) {
      return res.status(403).json({ message: 'No puedes eliminar la foto de otro usuario' });
    }

    const filePath = path.join(USERS_PATH, photo.fileName);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn(`No se pudo borrar el archivo físico: ${err}`);
    }

    em.remove(photo);
    await em.flush();

    res.status(200).json({ message: 'Foto de perfil eliminada' });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }
    res.status(500).json({ message: error.message });
  }
}

async function deleteUserUploadedFile(file: Express.Multer.File) {
  try {
    await fs.unlink(file.path);
  } catch (e) {
    console.warn('No se pudo borrar archivo temporal:', file.filename);
  }
}

export { uploadUserPhoto, deleteUserPhoto };
