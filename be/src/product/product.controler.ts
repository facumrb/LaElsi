import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { Product } from './product.entity.js';
import { orm } from '../shared/db/orm.js';
import { Photo } from '../photo/photo.entity.js';
/* import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "imagenesProductos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer para cargar múltiples imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "imagenesProductos"); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombrar el archivo
  }
});

let cantMaxPhotos = 10;
const imagenProducto = multer({ storage }).array("photos", cantMaxPhotos); // "Fotos" es el nombre del campo en el formulario

// Definir la función de carga de imágenes
async function cargaImagenes(req: express.Request, res: express.Response) {
  // Verificar si se han subido archivos
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    return res.status(400).send("No se han subido archivos.");
  }

  try {
    const filePaths: string[] = [];

    // Convertir req.files a un arreglo si es necesario
    const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

    for (const file of filesArray) {
      const uploadPath = path.join(__dirname, "imagenes", file.originalname);
      await fs.promises.writeFile(uploadPath, file.buffer);
      filePaths.push(uploadPath);
    }

    res.status(200).send("Imágenes guardadas: " + filePaths.join(", "));
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).send("Error al guardar las imágenes: " + error.message);
    } else {
      res.status(500).send("Error al guardar las imágenes: " + String(error));
    }
  }
} */

const em = orm.em;

function sanitizeProductInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    brand: req.body.brand,
    total_sold: req.body.total_sold,
    state: req.body.state,
    stock: req.body.stock,
    category: req.body.category
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
  try {
    const product = em.create(Product, req.body.sanitizedInput);
    await em.flush();

    res.status(201).json({ message: 'Producto creado', data: product });
  } catch (error: any) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error al crear el producto: ' + error.message });
  }
}

async function uploadPhotos(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const files = req.files as Express.Multer.File[]; // Multer pone los archivos aquí

    // 1. Validaciones
    if (!id) return res.status(400).json({ message: 'ID de Producto inválido' });
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No se enviaron imágenes' });
    }

    // 2. Buscamos el producto al que le vamos a asignar las fotos
    // Usamos el EntityManager (em)
    const product = await em.findOne(Product, { id });

    if (!product) {
      return res.status(404).json({ message: 'El item no existe' });
    }

    // 3. Recorremos los archivos y creamos entidades Foto
    for (const file of files) {
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
    console.error('Error al subir fotos:', error);
    return res.status(500).json({ message: 'Error interno: ' + error.message });
  }
}

// Función para buscar productos por texto
async function searchProductsByText(req: Request, res: Response) {
  const { query } = req.query; // Obtener el texto de búsqueda

  try {
    const products = await em.find(Product, {
      $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }, { brand: { $like: `%${query}%` } }]
    }); // Buscar por nombre, descripcion y marca
    res.status(200).json({ message: 'Productos encontrados', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Función para obtener productos por categoría
async function findProductsByCategory(req: Request, res: Response) {
  const categoryName = req.params.categoryName; // Obtener nombre de categoría

  try {
    const products = await em.find(Product, { category: { name: categoryName } }); // Buscar por categoría
    res.status(200).json({ message: 'Productos encontrados en la categoría', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findAll(req: Request, res: Response) {
  try {
    const products = await em.find(Product, {}, { populate: ['category'] });
    res.status(200).json({ message: 'Todos los Productos fueron encontrados', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(Product, { id }, { populate: ['category'] });
    res.status(200).json({ message: 'Producto encontrado', data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(Product, { id });
    em.assign(product, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'Producto actualizado', data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(Product, { id });
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

export { sanitizeProductInput, findAll, findOne, add, uploadPhotos, update, remove, searchProductsByText, findProductsByCategory /* cargaImagenes, imagenProducto, uploadDir */ };
