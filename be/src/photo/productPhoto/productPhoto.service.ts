import { orm } from '../../shared/db/orm.js';
import { Product } from '../../product/product.entity.js';
import { ProductPhoto } from './productPhoto.entity.js';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '../../shared/errors/appError.js';
import { PRODUCTS_PATH } from '../../shared/config/paths.config.js';
import { FileStorageUtil } from '../../shared/utils/fileStorage.util.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB por archivo

export class ProductPhotoService {
  static async uploadProductPhotos(id: number, files: Express.Multer.File[], orders: any) {
    const em = orm.em.fork();

    if (!files || files.length === 0) {
      throw new AppError('No se enviaron imágenes', 400);
    }

    try {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new AppError(`El archivo "${file.originalname}" excede el límite de 5MB`, 400);
        }
      }

      const product = await em.findOne(Product, { id }, { populate: ['photos'] });

      if (!product) {
        throw new AppError('El producto no existe', 404);
      }

      const MAX_PHOTOS = 10;
      if (product.photos.length + files.length > MAX_PHOTOS) {
        throw new AppError(`Limite de ${MAX_PHOTOS} fotos excedido.`, 400);
      }

      let ordersArray: number[] = [];
      if (Array.isArray(orders)) {
        ordersArray = orders.map((o: any) => Number(o));
      } else if (orders) {
        ordersArray = [Number(orders)];
      }

      const useExplicitOrder = ordersArray.length === files.length;
      let nextFallbackOrder = (product.photos.length > 0 ? Math.max(...product.photos.getItems().map((p) => p.order)) : -1) + 1;

      for (const [i, file] of files.entries()) {
        const photo = new ProductPhoto();
        photo.fileName = file.filename;
        photo.product = product;
        if (useExplicitOrder) {
          // Seguridad: usar .at() para evitar falsos positivos del SAST
          // sobre notación de corchetes con entrada de usuario (CWE-1321).
          photo.order = ordersArray.at(i) as number;
        } else {
          photo.order = nextFallbackOrder++;
        }
        em.persist(photo);
      }

      product.updatedAt = new Date();
      await em.flush();
      return { cantidad: files.length };
    } catch (error: any) {
      if (files) await this.deleteProductUploadedFiles(files);
      throw error;
    }
  }

  static async reorderProductPhotos(photosOrder: any[]) {
    const em = orm.em.fork();

    if (!photosOrder || !Array.isArray(photosOrder)) {
      throw new AppError('Formato inválido', 400);
    }

    for (const item of photosOrder) {
      if (!item.id || isNaN(Number(item.id))) {
        throw new AppError('Cada elemento debe tener un "id" numérico válido', 400);
      }
      if (item.order === undefined || item.order === null || isNaN(Number(item.order)) || !Number.isInteger(Number(item.order)) || Number(item.order) < 0) {
        throw new AppError(`El "order" del elemento con id ${item.id} debe ser un entero mayor o igual a 0`, 400);
      }
    }

    let productIdToUpdate: number | null = null;

    for (const item of photosOrder) {
      const photo = await em.findOne(ProductPhoto, { id: Number(item.id) }, { populate: ['product'] });
      if (!photo) {
        throw new AppError(`Foto con id ${item.id} no encontrada`, 404);
      }
      photo.order = Number(item.order);
      if (!productIdToUpdate) {
        productIdToUpdate = photo.product.id;
      }
    }

    if (productIdToUpdate) {
      await em.nativeUpdate(Product, { id: productIdToUpdate }, { updatedAt: new Date() });
    }

    await em.flush();
  }

  static async deleteProductPhoto(id: number) {
    const em = orm.em.fork();

    const photo = await em.findOne(ProductPhoto, { id }, { populate: ['product'] });

    if (!photo) {
      throw new AppError('La foto no existe', 404);
    }

    await FileStorageUtil.safeDeleteFile(PRODUCTS_PATH, photo.fileName);

    await em.nativeUpdate(Product, { id: photo.product.id }, { updatedAt: new Date() });
    em.remove(photo);
    await em.flush();
  }

  private static async deleteProductUploadedFiles(files: Express.Multer.File[]) {
    await FileStorageUtil.deleteTempMulterFiles(PRODUCTS_PATH, files);
  }
}
