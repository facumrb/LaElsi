import { orm } from '../shared/db/orm.js';
import { Product } from './product.entity.js';
import { Category } from '../category/category.entity.js';
import { Price } from './price/price.entity.js';
import { ProductState, CategoryState } from '../shared/enums/state.enum.js';
import { Currency } from '../shared/enums/currency.enum.js';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '../shared/errors/appError.js';
import { CategoryService } from '../category/category.service.js';
import { PaginatedResult } from '../shared/utils/pagination.interface.js';
import { DEFAULT_PAGE_SIZE } from '../shared/config/pagination.js';
import { buildPaginatedResponse } from '../shared/utils/pagination.js';

const PRODUCT_PATH = path.join(process.cwd(), 'uploads', 'products');
const VALID_CURRENCIES = Object.values(Currency);
const VALID_PRODUCT_STATES = Object.values(ProductState);

export interface CreateProductDto {
  name: string;
  description: string;
  brand: string;
  totalSold?: number;
  state?: ProductState;
  stock: number;
  price: number;
  currency?: Currency;
  category: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  brand?: string;
  totalSold?: number;
  state?: ProductState;
  stock?: number;
  price?: number;
  currency?: Currency;
  category?: number;
}

export class ProductService {
  static async addProduct(data: CreateProductDto) {
    const em = orm.em;
    const { price, currency, ...productData } = data;

    if (!productData.name || !productData.description || !productData.brand || productData.stock === undefined || price === undefined) {
      throw new AppError('Los campos nombre, descripción, marca, stock y precio son obligatorios', 400);
    }

    if (typeof price !== 'number' || price <= 0) {
      throw new AppError('El precio debe ser un número positivo', 400);
    }

    if (typeof productData.stock !== 'number' || productData.stock < 0 || !Number.isInteger(productData.stock)) {
      throw new AppError('El stock debe ser un número entero mayor o igual a 0', 400);
    }

    if (productData.totalSold !== undefined) {
      if (typeof productData.totalSold !== 'number' || productData.totalSold < 0 || !Number.isInteger(productData.totalSold)) {
        throw new AppError('El total vendido debe ser un número entero mayor o igual a 0', 400);
      }
    }

    if (currency !== undefined && !VALID_CURRENCIES.includes(currency)) {
      throw new AppError(`Moneda inválida. Las monedas válidas son: ${VALID_CURRENCIES.join(', ')}`, 400);
    }

    if (!productData.category) {
      throw new AppError('La categoría es obligatoria', 400);
    }

    const category = await em.findOne(Category, { id: productData.category });
    if (!category) {
      throw new AppError('La categoría especificada no existe', 404);
    }

    const productEntityData: any = {
      ...productData,
      category: em.getReference(Category, productData.category),
      deletedAt: productData.state === ProductState.Inactivo ? new Date() : undefined
    };

    const product = em.create(Product, productEntityData);
    
    // update price logic
    const newPrice = em.create(Price, {
      amount: price,
      currency: currency || Currency.ARS,
      product: product,
      isCurrent: true,
      validFrom: new Date()
    });
    product.prices.add(newPrice);

    try {
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
    return product;
  }

  static async searchProductsByText(query: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Product>> {
    const em = orm.em;
    if (!query || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }
    const offset = (page - 1) * limit;

    const [data, total] = await em.findAndCount(
      Product,
      {
        state: ProductState.Activo,
        category: { state: CategoryState.Activo },
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }, { brand: { $like: `%${query}%` } }]
      },
      {
        populate: ['category', 'photos', 'prices'],
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } },
        limit,
        offset
      }
    );
    
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async findProductsByCategory(categoryId: number, page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Product>> {
    const em = orm.em;
    const offset = (page - 1) * limit;
    const [data, total] = await em.findAndCount(
      Product,
      { category: { id: categoryId } },
      { populate: ['category', 'photos', 'prices'], limit, offset }
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async findActiveProductsByCategory(categoryId: number, page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Product>> {
    const em = orm.em;
    const offset = (page - 1) * limit;
    const [data, total] = await em.findAndCount(
      Product,
      {
        category: { id: categoryId, state: CategoryState.Activo },
        state: ProductState.Activo
      },
      {
        populate: ['category', 'photos', 'prices'],
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } },
        limit,
        offset
      }
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async findAll(
    page: number = 1,
    limit: number = DEFAULT_PAGE_SIZE,
    filters: { query?: string; state?: ProductState; categoryId?: number; stockFilter?: string } = {}
  ): Promise<PaginatedResult<Product>> {
    const em = orm.em;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filters.query) {
      where.$or = [
        { name: { $like: `%${filters.query}%` } },
        { description: { $like: `%${filters.query}%` } },
        { brand: { $like: `%${filters.query}%` } }
      ];
    }

    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.categoryId) {
      where.category = { id: filters.categoryId };
    }

    if (filters.stockFilter) {
      if (filters.stockFilter === 'AltoStock') where.stock = { $gt: 10 };
      if (filters.stockFilter === 'BajoStock') where.stock = { $lte: 10, $gt: 0 };
      if (filters.stockFilter === 'SinStock') where.stock = 0;
    }

    const [data, total] = await em.findAndCount(Product, where, {
      populate: ['category', 'photos', 'prices'],
      populateOrderBy: { photos: { order: 'ASC' } },
      limit,
      offset,
      orderBy: { id: 'ASC' }
    });

    return buildPaginatedResponse(data, total, page, limit);
  }

  static async findOne(id: number) {
    const em = orm.em;
    const product = await em.findOne(Product, { id }, { populate: ['category.parent.parent', 'photos', 'prices'] as any, populateOrderBy: { photos: { order: 'ASC' } } as any });
    if (!product) throw new AppError('Producto no encontrado', 404);
    return product;
  }

  static async findOneActive(id: number) {
    const em = orm.em;
    const product = await em.findOne(
      Product,
      { id, state: ProductState.Activo, category: { state: CategoryState.Activo } },
      {
        populate: ['category.parent.parent', 'photos', 'prices'] as any,
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );
    if (!product) throw new AppError('Producto no encontrado', 404);
    return product;
  }

  static async updateProduct(id: number, data: UpdateProductDto) {
    const em = orm.em;
    const product = await em.findOne(Product, { id }, { populate: ['category', 'photos', 'prices'] });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    const oldCategoryId = (product.category as any)?.id ?? product.category;
    const { price, currency, ...updateData } = data;

    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      throw new AppError('El precio debe ser un número positivo', 400);
    }

    if (updateData.stock !== undefined && (typeof updateData.stock !== 'number' || updateData.stock < 0 || !Number.isInteger(updateData.stock))) {
      throw new AppError('El stock debe ser un número entero mayor o igual a 0', 400);
    }

    if (currency !== undefined && !VALID_CURRENCIES.includes(currency)) {
      throw new AppError(`Moneda inválida. Las monedas válidas son: ${VALID_CURRENCIES.join(', ')}`, 400);
    }

    if (updateData.state !== undefined && !VALID_PRODUCT_STATES.includes(updateData.state)) {
      throw new AppError(`Estado de producto inválido. Los estados válidos son: ${VALID_PRODUCT_STATES.join(', ')}`, 400);
    }

    const currentPrice = product.prices.getItems().find((p) => p.isCurrent);
    if (price !== undefined && price !== currentPrice?.amount) {
      // update price logic
      product.prices.getItems().forEach((p) => {
        if (p.isCurrent) p.isCurrent = false;
      });

      const newPrice = em.create(Price, {
        amount: price,
        currency: currency || Currency.ARS,
        product: product,
        isCurrent: true,
        validFrom: new Date()
      });
      product.prices.add(newPrice);
    }

    const oldState = product.state;
    em.assign(product, updateData);

    if (product.state !== oldState) {
       product.deletedAt = new Date();
    }

    try {
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }

    // 1. Si el producto pasó a Inactivo, verificar si su categoría actual debe desactivarse
    if (product.state === ProductState.Inactivo && oldState === ProductState.Activo) {
      const categoryId = (product.category as any)?.id ?? product.category;
      if (categoryId) {
        await CategoryService.checkAndDeactivateCategory(categoryId);
      }
    }

    // 2. Si el producto CAMBIÓ de categoría y está activo, la categoría anterior podría quedar vacía
    if (updateData.category && oldState === ProductState.Activo && product.state === ProductState.Activo) {
      if (oldCategoryId !== updateData.category) {
        await CategoryService.checkAndDeactivateCategory(oldCategoryId);
      }
    }

    return product;
  }

  static async removeProduct(id: number) {
    const em = orm.em;
    const product = await em.findOne(Product, { id }, { populate: ['photos', 'category'] });

    if (!product) {
      throw new AppError('El producto no existe', 404);
    }

    const categoryId = (product.category as any)?.id ?? product.category;

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

    // Verificar si la categoría debe desactivarse tras eliminar el producto
    if (categoryId) {
      await CategoryService.checkAndDeactivateCategory(categoryId);
    }
  }

  static async findPage(page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Product>> {
    // 🚨 Para el cliente final, SÓLO se devuelven los activos con categoría activa
    return this.findAllActive(page, limit);
  }

  static async findAllActive(page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Product>> {
    const em = orm.em;
    const offset = (page - 1) * limit;
    const [data, total] = await em.findAndCount(
      Product,
      { state: ProductState.Activo, category: { state: CategoryState.Activo } },
      {
        populate: ['category', 'photos', 'prices'],
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } },
        limit,
        offset
      }
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async findBestSellers(limit: number) {
    const em = orm.em;
    return em.find(
      Product,
      { state: ProductState.Activo, category: { state: CategoryState.Activo } },
      {
        populate: ['category', 'photos', 'prices'],
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } },
        orderBy: { totalSold: 'DESC' },
        limit
      }
    );
  }

  static async findBestSellersByCategory(categoryId: number, limit: number) {
    const em = orm.em;
    return em.find(
      Product,
      {
        category: { id: categoryId, state: CategoryState.Activo },
        state: ProductState.Activo
      },
      {
        populate: ['category', 'photos', 'prices'],
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } },
        orderBy: { totalSold: 'DESC' },
        limit
      }
    );
  }

  private static handleUniqueConstraintError(error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      throw new AppError('Ya existe un producto con el mismo nombre', 409);
    }
  }
}
