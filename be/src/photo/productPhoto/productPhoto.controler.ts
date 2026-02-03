import { Request, Response } from 'express';
import { orm } from '../../shared/db/orm.js';
import { Product } from '../../product/product.entity.js';
import { Photo } from '../photo.entity.js'; // Import base Photo for general operations if needed, or remove if unused/replaced completely
import { ProductPhoto } from './productPhoto.entity.js';
import path from 'path';
import fs from 'fs/promises';

async function uploadProductPhotos(req: Request, res: Response) {
  const em = orm.em.fork();
  const files = req.files as Express.Multer.File[];
  const { orders } = req.body;

  try {
    const id = Number(req.params.id);

    if (!id) return res.status(400).json({ message: 'ID de Producto inválido' });
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No se enviaron imágenes' });
    }

    // Buscamos el producto al que le vamos a asignar las fotos
    // Populate 'photos' matches the property name in Product entity
    const product = await em.findOne(Product, { id }, { populate: ['photos'] });
    if (!product) {
      await deleteProductUploadedFiles(files);
      return res.status(404).json({ message: 'El producto no existe' });
    }

    // Validamos el límite de fotos por producto
    const MAX_PHOTOS = 10;
    if (product.photos.length + files.length > MAX_PHOTOS) {
      await deleteProductUploadedFiles(files);
      return res.status(400).json({
        message: `Limite de ${MAX_PHOTOS} fotos excedido.`
      });
    }

    // Lógica de orden de las fotos
    let ordersArray: number[] = [];
    if (Array.isArray(orders)) {
      ordersArray = orders.map((o) => Number(o));
    } else if (orders) {
      ordersArray = [Number(orders)];
    }
    const useExplicitOrder = ordersArray.length === files.length;

    // Calculate next order. product.photos is Collection<ProductPhoto>, so accessing .order is valid.
    let nextFallbackOrder = (product.photos.length > 0 ? Math.max(...product.photos.getItems().map((p) => p.order)) : -1) + 1;

    // Recorremos los archivos y creamos entidades ProductPhoto
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photo = new ProductPhoto();
      photo.fileName = file.filename; // Nombre generado (uuid)
      photo.originalName = file.originalname; // Nombre original
      photo.mimeType = file.mimetype;
      photo.product = product;
      if (useExplicitOrder) {
        photo.order = ordersArray[i]; // Usamos lo que dijo el usuario
      } else {
        photo.order = nextFallbackOrder++; // Si falla, lo mandamos al final
      }
      em.persist(photo); // Preparamos para guardar
    }

    // 4. Guardamos todo en la base de datos
    await em.flush();

    return res.status(201).json({
      message: 'Fotos subidas correctamente',
      cantidad: files.length
    });
  } catch (error: any) {
    if (files) await deleteProductUploadedFiles(files);
    return res.status(500).json({ message: 'Error interno: ' + error.message });
  }
}

// Función auxiliar para limpiar fotos basura si la validación falla
async function deleteProductUploadedFiles(files: Express.Multer.File[]) {
  for (const file of files) {
    try {
      await fs.unlink(file.path);
    } catch (e) {
      console.warn('No se pudo borrar archivo temporal:', file.filename);
    }
  }
}

async function reorderProductPhotos(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const { photosOrder } = req.body; // Esperamos un array: [{ id: 1, order: 0 }, { id: 5, order: 1 }]

    if (!photosOrder || !Array.isArray(photosOrder)) {
      return res.status(400).json({ message: 'Formato inválido' });
    }

    for (const item of photosOrder) {
      // Solo actualizamos fotos existentes (tienen ID numérico)
      if (item.id) {
        // Use ProductPhoto to access 'order'
        const photo = await em.findOne(ProductPhoto, { id: item.id });
        if (photo) {
          photo.order = item.order;
        }
      }
    }

    await em.flush();
    res.status(200).json({ message: 'Orden actualizado' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function deleteProductPhoto(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const id = Number(req.params.photoId);

    // 1. Buscamos la foto en la BD para saber su nombre. Can use ProductPhoto for specificity.
    const photo = await em.findOneOrFail(ProductPhoto, { id });

    // 2. Construimos la ruta absoluta al archivo debe coincidir con la carpeta donde Multer las guarda
    // Assuming uploads go to 'uploads' generally, or specific folder? keeping 'uploads' as per current state.
    const filePath = path.join(process.cwd(), 'uploads', photo.fileName);

    // 3. Intentamos borrar el archivo físico
    try {
      await fs.unlink(filePath);
      console.log(`Archivo borrado: ${filePath}`);
    } catch (err) {
      // Si el archivo no existe en disco, solo avisamos pero seguimos para poder borrar el registro de la BD.
      console.warn(`No se pudo borrar el archivo físico (quizás no existía): ${err}`);
    }

    // 4. Borramos el registro de la Base de Datos
    em.remove(photo);
    await em.flush();

    res.status(200).json({ message: 'Foto eliminada correctamente' });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'La foto no existe' });
    }
    res.status(500).json({ message: error.message });
  }
}

export { uploadProductPhotos, reorderProductPhotos, deleteProductPhoto };
