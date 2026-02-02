import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Product } from './product.entity.js';
import { Category } from '../category/category.entity.js';
import { Photo } from '../photo/photo.entity.js';
import path from 'path';
import fs from 'fs/promises';

function sanitizeProductInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    brand: req.body.brand,
    total_sold: req.body.total_sold,
    state: req.body.state,
    stock: req.body.stock,
    category: req.body.categoryName
    /* registration_date: req.body.registration_date,
    update_date: req.body.update_date,
    to_reserve: req.body.to_reserve,
    quantity_to_reserve: req.body.quantity_to_reserve */
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

async function add(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const input = req.body.sanitizedInput;

    input.category = em.getReference(Category, input.category);

    const product = em.create(Product, input);
    await em.flush();

    res.status(201).json({ message: 'Producto creado', data: product });
  } catch (error: any) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error al crear el producto: ' + error.message });
  }
}

async function uploadPhotos(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const id = Number(req.params.id);
    const files = req.files as Express.Multer.File[]; // Multer pone los archivos aquí

    // 1. Validaciones
    if (!id) return res.status(400).json({ message: 'ID de Producto inválido' });
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No se enviaron imágenes' });
    }

    // 2. Buscamos el producto al que le vamos a asignar las fotos
    const product = await em.findOne(Product, { id });

    if (!product) {
      return res.status(404).json({ message: 'El producto no existe' });
    }

    // 3. Recorremos los archivos y creamos entidades Foto
    for (const file of files) {
      console.log('4. Procesando archivo:', file.filename);
      const photo = new Photo();
      photo.fileName = file.filename; // Nombre generado (uuid)
      photo.originalName = file.originalname; // Nombre original
      photo.mimeType = file.mimetype;
      photo.product = product;
      em.persist(photo); // Preparamos para guardar
    }

    // 4. Guardamos todo en la base de datos
    await em.flush();

    return res.status(201).json({
      message: 'Fotos subidas correctamente',
      cantidad: files.length
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error interno: ' + error.message });
  }
}

async function reorderPhotos(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const { photosOrder } = req.body; // Esperamos un array: [{ id: 1, order: 0 }, { id: 5, order: 1 }]

    if (!photosOrder || !Array.isArray(photosOrder)) {
      return res.status(400).json({ message: 'Formato inválido' });
    }

    for (const item of photosOrder) {
      // Solo actualizamos fotos existentes (tienen ID numérico)
      if (item.id) {
        const photo = await em.findOne(Photo, { id: item.id });
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

// Función para buscar productos por nombre, descripcion y marca
async function searchProductsByText(req: Request, res: Response) {
  const em = orm.em.fork();
  const { query } = req.query; // Obtener el texto de búsqueda

  try {
    const products = await em.find(
      Product,
      {
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }, { brand: { $like: `%${query}%` } }]
      },
      {
        populate: ['category', 'photos']
      }
    );
    res.status(200).json({ message: 'Productos encontrados', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Función para obtener productos por categoría
async function findProductsByCategory(req: Request, res: Response) {
  const em = orm.em.fork();
  const categoryName = req.params.categoryName; // Obtener nombre de categoría

  try {
    const products = await em.find(
      Product,
      {
        category: { name: categoryName }
      },
      {
        populate: ['category', 'photos']
      }
    );
    res.status(200).json({ message: 'Productos encontrados en la categoría', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findAll(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const products = await em.find(
      Product,
      {},
      {
        populate: ['category', 'photos'],
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );
    res.status(200).json({ message: 'Todos los Productos fueron encontrados', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(Product, { id }, { populate: ['category', 'photos'], populateOrderBy: { photos: { order: 'ASC' } } });
    res.status(200).json({ message: 'Producto encontrado', data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(
      Product,
      { id },
      {
        populate: ['category', 'photos']
      }
    );
    em.assign(product, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'Producto actualizado', data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function deletePhoto(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const id = Number(req.params.photoId);

    // 1. Buscamos la foto en la BD para saber su nombre
    const photo = await em.findOneOrFail(Photo, { id });

    // 2. Construimos la ruta absoluta al archivo
    // Debe coincidir con la carpeta donde Multer las guarda
    const filePath = path.join(process.cwd(), 'uploads', photo.fileName);

    // 3. Intentamos borrar el archivo físico
    try {
      await fs.unlink(filePath);
      console.log(`Archivo borrado: ${filePath}`);
    } catch (err) {
      // Si el archivo no existe en disco, solo avisamos pero seguimos
      // para poder borrar el registro de la BD.
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

async function remove(req: Request, res: Response) {
  const em = orm.em.fork();
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(Product, { id }, { populate: ['photos'] });
    for (const photo of product.photos) {
      const filePath = path.join(process.cwd(), 'uploads', photo.fileName);

      try {
        await fs.unlink(filePath);
        console.log(`Foto eliminada del disco: ${photo.fileName}`);
      } catch (err) {
        // Si falla (ej: el archivo ya no existía manualmente), solo avisamos en consola
        // pero NO detenemos el proceso, para que se termine de borrar el producto de la BD.
        console.warn(`No se pudo borrar el archivo físico (quizás no existía): ${photo.fileName}`);
      }
    }
    em.remove(product);
    await em.flush();
    res.status(200).send({ message: 'Producto eliminado' });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ message: 'El producto no existe' });
    }
    res.status(500).json({ message: error.message });
  }
}

export {
  sanitizeProductInput,
  findAll,
  findOne,
  add,
  uploadPhotos,
  reorderPhotos,
  deletePhoto,
  update,
  remove,
  searchProductsByText,
  findProductsByCategory /* cargaImagenes, imagenProducto, uploadDir */
};
