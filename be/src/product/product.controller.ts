import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js';
import { Product } from './product.entity.js';
import { Category } from '../category/category.entity.js';
import path from 'path';
import fs from 'fs/promises';

function sanitizeProductInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    currency: req.body.currency,
    brand: req.body.brand,
    total_sold: req.body.total_sold,
    state: req.body.state,
    stock: req.body.stock,
    category: req.body.categoryId
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
  const em = orm.em;
  try {
    const input = req.body.sanitizedInput;
    const { price, currency, ...productData } = input;
    productData.category = em.getReference(Category, productData.category);

    const product = em.create(Product, productData);
    product.updatePrice(price, currency);

    await em.flush();

    res.status(201).json({ message: 'Producto creado', data: product });
  } catch (error: any) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error al crear el producto: ' + error.message });
  }
}

// Función para buscar productos por nombre, descripcion y marca
async function searchProductsByText(req: Request, res: Response) {
  const em = orm.em;
  const { query } = req.query; // Obtener el texto de búsqueda

  try {
    const products = await em.find(
      Product,
      {
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }, { brand: { $like: `%${query}%` } }]
      },
      {
        populate: ['category', 'photos', 'prices']
      }
    );
    res.status(200).json({ message: 'Productos encontrados', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Función para obtener productos por categoría
async function findProductsByCategory(req: Request, res: Response) {
  const em = orm.em;
  const categoryId = Number.parseInt(req.params.categoryId); // Obtener ID de categoría

  try {
    const products = await em.find(
      Product,
      {
        category: { id: categoryId }
      },
      {
        populate: ['category', 'photos', 'prices']
      }
    );
    res.status(200).json({ message: 'Productos encontrados en la categoría', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findAll(req: Request, res: Response) {
  const em = orm.em;
  try {
    const products = await em.find(
      Product,
      {},
      {
        populate: ['category', 'photos', 'prices'],
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );
    res.status(200).json({ message: 'Todos los Productos fueron encontrados', data: products });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(Product, { id }, { populate: ['category', 'photos', 'prices'], populateOrderBy: { photos: { order: 'ASC' } } });
    res.status(200).json({ message: 'Producto encontrado', data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  const em = orm.em;
  try {
    const id = Number.parseInt(req.params.id);
    const product = await em.findOneOrFail(
      Product,
      { id },
      {
        populate: ['category', 'photos', 'prices']
      }
    );
    const { price, currency, ...updateData } = req.body.sanitizedInput;

    // Si el precio cambio, usamos el metodo de la entidad para guardar el historico
    const currentPrice = product.prices.getItems().find((p) => p.isCurrent);
    if (price !== undefined && price !== currentPrice?.amount) {
      product.updatePrice(price, currency);
    }

    em.assign(product, updateData);
    await em.flush();
    res.status(200).json({ message: 'Producto actualizado', data: product });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  const em = orm.em;
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

const DEFAULT_LIMIT = 10;

async function findPage(req: Request, res: Response) {
  const em = orm.em;

  // Obtenemos los parámetros de la query (con valores por defecto)
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const offset = (page - 1) * limit; // Salta los productos anteriores a la página actual (page - 1)

  try {
    // findAndCount devuelve un array: [items, totalCount]
    const [products, total] = await em.findAndCount(
      Product,
      {},
      {
        populate: ['category', 'photos', 'prices'],
        limit,
        offset,
        populateOrderBy: { photos: { order: 'ASC' } } // Ordena las fotos por orden creciente basado en "order"
      }
    );

    // construimos un objeto que le da al frontend todo lo que necesita para dibujar la barrita de paginación
    res.status(200).json({
      message: 'Página de productos encontrada',
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { findPage, sanitizeProductInput, findAll, findOne, add, update, remove, searchProductsByText, findProductsByCategory };
