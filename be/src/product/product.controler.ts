import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { Product } from './product.entity.js';
import { orm } from '../shared/db/orm.js';
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
    photos: req.body.photos,
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
    /* const { name, category, price, brand, stock } = req.body.sanitizedInput;
    //  description, state, total_sold ?
    // Validaciones para asegurarse de que los atributos no sean nulos
    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }
    if (!category) {
      return res.status(400).json({ message: "La categoría es requerida" });
    }
    if (price === undefined || price === null) {
      return res.status(400).json({ message: "El precio es requerido" });
    }
    if (!brand) {
      return res.status(400).json({ message: "La marca es requerida" });
    }
    if (stock === undefined || stock === null) {
      return res.status(400).json({ message: "El stock es requerido" });
    }

    // Obtener las rutas de todas las imágenes cargadas
    const photos = [];
    if (Array.isArray(req.files)) {
      for (let i = 0; i < req.files.length; i++) {
        photos.push(req.files[i].path);
      }
    } else {
      console.error("req.files no es un arreglo");
    }
    // Crear un nuevo producto utilizando los datos sanitizados del cuerpo de la solicitud
    const productData = {
      ...req.body.sanitizedInput,
      photos // Asignar la ruta de la imagen al product
      // to_reserve: false,
      // quantity_to_reserve: 0,
    }; */

    const product = em.create(Product, req.body.sanitizedInput);
    await em.flush();

    res.status(201).json({ message: 'Producto creado', data: product });
  } catch (error: any) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error al crear el producto: ' + error.message });
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

export { sanitizeProductInput, findAll, findOne, add, update, remove, searchProductsByText, findProductsByCategory /* cargaImagenes, imagenProducto, uploadDir */ };
