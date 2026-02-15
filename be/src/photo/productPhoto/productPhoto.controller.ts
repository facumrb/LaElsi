import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { Product } from '../../product/product.entity.js';
import { ProductPhoto } from './productPhoto.entity.js';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';

const UPLOADS_PATH = path.join(process.cwd(), 'uploads', 'products');
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB por archivo

export class ProductPhotoController {
  static uploadProductPhotos = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const files = req.files as Express.Multer.File[];
    const { orders } = req.body;
    const id = Number(req.params.id);

    if (isNaN(id)) throw new AppError('ID de Producto inválido', 400);
    if (!files || files.length === 0) {
      throw new AppError('No se enviaron imágenes', 400);
    }

    try {
      // Validar tamaño de cada archivo
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new AppError(`El archivo "${file.originalname}" excede el límite de 2MB`, 400);
        }
      }

      // Buscamos el producto
      const product = await em.findOne(Product, { id }, { populate: ['photos'] });

      if (!product) {
        throw new AppError('El producto no existe', 404);
      }

      // Validamos el límite de fotos
      const MAX_PHOTOS = 10;
      if (product.photos.length + files.length > MAX_PHOTOS) {
        throw new AppError(`Limite de ${MAX_PHOTOS} fotos excedido.`, 400);
      }

      // Ordenamiento
      let ordersArray: number[] = [];
      if (Array.isArray(orders)) {
        ordersArray = orders.map((o) => Number(o));
      } else if (orders) {
        ordersArray = [Number(orders)];
      }
      const useExplicitOrder = ordersArray.length === files.length;
      let nextFallbackOrder = (product.photos.length > 0 ? Math.max(...product.photos.getItems().map((p) => p.order)) : -1) + 1;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const photo = new ProductPhoto();
        photo.fileName = file.filename;
        photo.originalName = file.originalname;
        photo.mimeType = file.mimetype;
        photo.product = product;
        if (useExplicitOrder) {
          photo.order = ordersArray[i];
        } else {
          photo.order = nextFallbackOrder++;
        }
        em.persist(photo);
      }

      await em.flush();

      return res.status(201).json(ApiResponse.created('Fotos subidas correctamente', { cantidad: files.length }));
    } catch (error: any) {
      // Cleanup en caso de error
      if (files) await ProductPhotoController.deleteProductUploadedFiles(files);
      throw error; // Re-throw para que lo capture el global handler
    }
  });

  private static async deleteProductUploadedFiles(files: Express.Multer.File[]) {
    for (const file of files) {
      try {
        await fs.unlink(file.path);
      } catch (e) {
        console.warn('No se pudo borrar archivo temporal:', file.filename);
      }
    }
  }

  static reorderProductPhotos = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const { photosOrder } = req.body;

    if (!photosOrder || !Array.isArray(photosOrder)) {
      throw new AppError('Formato inválido', 400);
    }

    // Validar cada item del array
    for (const item of photosOrder) {
      if (!item.id || isNaN(Number(item.id))) {
        throw new AppError('Cada elemento debe tener un "id" numérico válido', 400);
      }
      if (item.order === undefined || item.order === null || isNaN(Number(item.order)) || !Number.isInteger(Number(item.order)) || Number(item.order) < 0) {
        throw new AppError(`El "order" del elemento con id ${item.id} debe ser un entero mayor o igual a 0`, 400);
      }
    }

    for (const item of photosOrder) {
      const photo = await em.findOne(ProductPhoto, { id: Number(item.id) });
      if (!photo) {
        throw new AppError(`Foto con id ${item.id} no encontrada`, 404);
      }
      photo.order = Number(item.order);
    }

    await em.flush();
    return res.status(200).json(ApiResponse.success('Orden actualizado'));
  });

  static deleteProductPhoto = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const id = Number(req.params.photoId);
    if (isNaN(id)) throw new AppError('ID de foto inválido', 400);

    const photo = await em.findOne(ProductPhoto, { id });

    if (!photo) {
      throw new AppError('La foto no existe', 404);
    }

    const filePath = path.join(UPLOADS_PATH, photo.fileName);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn(`No se pudo borrar el archivo físico (quizás no existía): ${err}`);
    }

    em.remove(photo);
    await em.flush();

    return res.status(200).json(ApiResponse.success('Foto eliminada correctamente'));
  });
}
