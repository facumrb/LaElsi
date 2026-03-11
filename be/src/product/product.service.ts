import { orm } from '../shared/db/orm.js';
import { Product } from './product.entity.js';
import { Category } from '../category/category.entity.js';
import { Price } from './price/price.entity.js';
import { ProductState, CategoryState } from '../shared/enums/state.enum.js';
import { Currency } from '../shared/enums/currency.enum.js';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '../shared/errors/appError.js';

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
      category: em.getReference(Category, productData.category)
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

  static async searchProductsByText(query: string) {
    const em = orm.em;
    if (!query || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }

    return em.find(
      Product,
      {
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }, { brand: { $like: `%${query}%` } }]
      },
      {
        populate: ['category', 'photos', 'prices']
      }
    );
  }

  static async findProductsByCategory(categoryId: number) {
    const em = orm.em;
    return em.find(
      Product,
      { category: { id: categoryId } },
      { populate: ['category', 'photos', 'prices'] }
    );
  }

  static async findActiveProductsByCategory(categoryId: number) {
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
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );
  }

  static async findAll() {
    const em = orm.em;
    return em.find(
      Product,
      {},
      {
        populate: ['category', 'photos', 'prices'],
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );
  }

  static async findOne(id: number) {
    const em = orm.em;
    const product = await em.findOne(Product, { id }, { populate: ['category', 'photos', 'prices'], populateOrderBy: { photos: { order: 'ASC' } } });
    if (!product) throw new AppError('Producto no encontrado', 404);
    return product;
  }

  static async updateProduct(id: number, data: UpdateProductDto) {
    const em = orm.em;
    const product = await em.findOne(Product, { id }, { populate: ['category', 'photos', 'prices'] });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

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

    em.assign(product, updateData);

    try {
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }

    return product;
  }

  static async removeProduct(id: number) {
    const em = orm.em;
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
  }

  static async findPage(page: number, limit: number) {
    const em = orm.em;
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

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async findAllActive() {
    const em = orm.em;
    return em.find(
      Product,
      { state: ProductState.Activo, category: { state: CategoryState.Activo } },
      {
        populate: ['category', 'photos', 'prices'],
        populateWhere: { prices: { isCurrent: true } },
        populateOrderBy: { photos: { order: 'ASC' } }
      }
    );
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
