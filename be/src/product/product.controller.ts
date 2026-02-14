import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { Product } from './product.entity.js';
import { Category } from '../category/category.entity.js';
import { ProductPhoto } from '../photo/productPhoto/productPhoto.entity.js';
import { ProductState, CategoryState } from '../shared/enums/state.enum.js';
import { Currency } from '../shared/enums/currency.enum.js';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';

const PRODUCT_PATH = path.join(process.cwd(), 'uploads', 'products');
const VALID_CURRENCIES = Object.values(Currency);
const VALID_PRODUCT_STATES = Object.values(ProductState);

function sanitizeProductInput(req: Request, res: Response, next: any) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    brand: req.body.brand,
    price: req.body.price,
    currency: req.body.currency,
    stock: req.body.stock,
    category: req.body.category,
    state: req.body.state
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

export class ProductController {

  static add = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const input = req.body.sanitizedInput;
    const { price, currency, ...productData } = input;

    // Validar campos obligatorios
    if (!productData.name || !productData.description || !productData.brand || productData.stock === undefined || price === undefined) {
      throw new AppError('Los campos nombre, descripción, marca, stock y precio son obligatorios', 400);
    }

    // Validar precio positivo
    if (typeof price !== 'number' || price <= 0) {
      throw new AppError('El precio debe ser un número positivo', 400);
    }

    // Validar stock >= 0 y entero
    if (typeof productData.stock !== 'number' || productData.stock < 0 || !Number.isInteger(productData.stock)) {
      throw new AppError('El stock debe ser un número entero mayor o igual a 0', 400);
    }

    // Validar currency si se proporciona
    if (currency !== undefined && !VALID_CURRENCIES.includes(currency)) {
      throw new AppError(`Moneda inválida. Las monedas válidas son: ${VALID_CURRENCIES.join(', ')}`, 400);
    }

    // Verificar que la categoría existe
    if (!productData.category) {
      throw new AppError('La categoría es obligatoria', 400);
    }

    const category = await em.findOne(Category, { id: productData.category });
    if (!category) {
      throw new AppError('La categoría especificada no existe', 404);
    }

    productData.category = em.getReference(Category, productData.category);

    const product = em.create(Product, productData);
    product.updatePrice(price, currency);

    try {
      await em.flush();
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un producto con el mismo nombre', 409);
      }
      throw error;
    }

    return res.status(201).json(ApiResponse.created('Producto creado', product));
  });


  static searchProductsByText = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }

    const products = await em.find(
      Product,
      {
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }, { brand: { $like: `%${query}%` } }]
      },
      {
        populate: ['category', 'photos', 'prices']
      }
    );

    return res.status(200).json(ApiResponse.success('Productos encontrados', products));
  });

  static findProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const categoryId = Number.parseInt(req.params.categoryId);
    if (isNaN(categoryId)) throw new AppError('ID de categoría inválido', 400);

    const products = await em.find(
      Product,
      {
        category: { id: categoryId }
      },
      {
        populate: ['category', 'photos', 'prices']
      }
    );

    return res.status(200).json(ApiResponse.success('Productos encontrados en la categoría', products));
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const products = await em.find(
      Product,
      {},
      {
        populate: ['category', 'photos', 'prices'],
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );
    return res.status(200).json(ApiResponse.success('Todos los Productos fueron encontrados', products));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de producto inválido', 400);

    const product = await em.findOne(Product, { id }, { populate: ['category', 'photos', 'prices'], populateOrderBy: { photos: { order: 'ASC' } } });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    return res.status(200).json(ApiResponse.success('Producto encontrado', product));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de producto inválido', 400);

    const product = await em.findOne(Product, { id }, { populate: ['category', 'photos', 'prices'] });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    const { price, currency, ...updateData } = req.body.sanitizedInput;

    // Validar precio si se proporciona
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      throw new AppError('El precio debe ser un número positivo', 400);
    }

    // Validar stock si se proporciona
    if (updateData.stock !== undefined && (typeof updateData.stock !== 'number' || updateData.stock < 0 || !Number.isInteger(updateData.stock))) {
      throw new AppError('El stock debe ser un número entero mayor o igual a 0', 400);
    }

    // Validar currency si se proporciona
    if (currency !== undefined && !VALID_CURRENCIES.includes(currency)) {
      throw new AppError(`Moneda inválida. Las monedas válidas son: ${VALID_CURRENCIES.join(', ')}`, 400);
    }

    // Validar state si se proporciona
    if (updateData.state !== undefined && !VALID_PRODUCT_STATES.includes(updateData.state)) {
      throw new AppError(`Estado de producto inválido. Los estados válidos son: ${VALID_PRODUCT_STATES.join(', ')}`, 400);
    }

    const currentPrice = product.prices.getItems().find((p) => p.isCurrent);
    if (price !== undefined && price !== currentPrice?.amount) {
      product.updatePrice(price, currency);
    }

    em.assign(product, updateData);

    try {
      await em.flush();
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un producto con el mismo nombre', 409);
      }
      throw error;
    }

    return res.status(200).json(ApiResponse.success('Producto actualizado', product));
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de producto inválido', 400);

    const product = await em.findOne(Product, { id }, { populate: ['photos'] });

    if (!product) {
      throw new AppError('El producto no existe', 404);
    }

    for (const photo of product.photos) {
      const filePath = path.join(PRODUCT_PATH, photo.fileName);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(`No se pudo borrar el archivo físico (quizás no existía): ${photo.fileName}`);
      }
    }
    em.remove(product);
    await em.flush();

    return res.status(200).json(ApiResponse.success('Producto eliminado'));
  });

  static findPage = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const DEFAULT_LIMIT = 10;

    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const [products, total] = await em.findAndCount(
      Product,
      {},
      {
        populate: ['category', 'photos', 'prices'],
        limit,
        offset,
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );

    return res.status(200).json(ApiResponse.success('Página de productos encontrada', {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }));
  });

  static findAllActive = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const products = await em.find(
      Product,
      { state: ProductState.ACTIVO, category: { state: CategoryState.ACTIVO } },
      {
        populate: ['category', 'photos', 'prices'],
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );

    return res.status(200).json(ApiResponse.success('Productos activos encontrados', products));
  });
}

export { sanitizeProductInput };
