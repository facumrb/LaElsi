import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PRODUCTS_PATH, USERS_PATH } from '../shared/config/paths.config.js';

export const optimizeImage = (subFolder: 'products' | 'users') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Si no hay archivos, pasar al siguiente middleware (multer y controlador se encargarán si era obligatorio)
    if (!req.file && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
      return next();
    }

    try {
      const uploadPath = subFolder === 'products' ? PRODUCTS_PATH : USERS_PATH;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Función auxiliar para procesar un solo archivo
      const processFile = async (file: Express.Multer.File) => {
        const uniqueName = `${uuidv4()}.webp`;
        const finalPath = path.join(uploadPath, uniqueName);

        const info = await sharp(file.buffer)
          .webp({ quality: 80 }) // Se puede modificar la calidad de la imagen en 100% si es necesario, pero 80 es suficiente para que no pierda calidad.
          .toFile(finalPath);

        // Actualizamos el objeto file original para que el controlador tenga los nuevos datos
        file.filename = uniqueName;
        file.path = finalPath;
        file.size = info.size;
      };

      if (req.file) {
        await processFile(req.file);
      } else if (req.files) {
        const files = req.files as Express.Multer.File[];
        await Promise.all(files.map(processFile));
      }

      next();
    } catch (error) {
      console.error('Error al optimizar imagen(es):', error);
      res.status(500).json({ status: 'error', message: 'Error al procesar la(s) imagen(es)' });
    }
  };
};
