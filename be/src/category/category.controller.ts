import { Request, Response, NextFunction } from 'express';
import { Category } from './category.entity.js';
import { orm } from '../shared/db/orm.js';
import { CategoryState, ProductState } from '../shared/enums/state.enum.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';

function sanitizeCategoryInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    order: req.body.order,
    state: req.body.state,
    products: req.body.products
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

export class CategoryController {
  static searchCategoriesByText = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const { query } = req.query;

    const categories = await em.find(
      Category,
      {
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }]
      },
      { populate: ['products.photos'] }
    );
    return res.status(200).json(ApiResponse.success('Categorías encontradas', categories));
  });

  static add = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const { name, description } = req.body.sanitizedInput;

    if (!name) {
      throw new AppError('El Nombre de la categoría es requerido', 400);
    }

    const categoryData = {
      name,
      description,
      order: req.body.sanitizedInput.order || 0,
      state: req.body.sanitizedInput.state || CategoryState.Activo
    };

    const category = em.create(Category, categoryData as any);
    try {
      await em.flush();
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe una categoría con este nombre', 409);
      }
      throw error;
    }

    return res.status(201).json(ApiResponse.created('Categoría creada', category));
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const categories = await em.find(Category, {}, { populate: ['products.photos'], orderBy: { order: 'ASC', name: 'ASC' } });
    return res.status(200).json(ApiResponse.success('Todas las Categorías fueron encontradas', categories));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    const category = await em.findOne(Category, { id }, { populate: ['products.photos'] });

    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    return res.status(200).json(ApiResponse.success('Categoría encontrada', category));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    const category = await em.findOne(Category, { id });

    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    em.assign(category, req.body.sanitizedInput);
    try {
      await em.flush();
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe una categoría con este nombre', 409);
      }
      throw error;
    }
    return res.status(200).json(ApiResponse.success('Categoría actualizada', category));
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    const category = await em.findOne(Category, { id }, { populate: ['products'] });

    if (!category) {
      throw new AppError('La categoría no existe', 404);
    }

    if (category.products.length > 0) {
      throw new AppError('Esta categoría tiene productos asociados.\n\n 💡 Consejo: Cámbia el estado a "Inactivo" en lugar de borrarla.', 400);
    }

    em.remove(category);
    await em.flush();
    return res.status(200).json(ApiResponse.success('Categoría eliminada'));
  });

  static findAllActive = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const categories = await em.find(
      Category,
      {
        state: CategoryState.Activo,
        products: {
          state: ProductState.Activo,
          prices: { isCurrent: true }
        }
      },
      {
        populate: ['products.photos', 'products.prices'],
        orderBy: { order: 'ASC', name: 'ASC', products: { photos: { order: 'ASC' } } }
      }
    );
    return res.status(200).json(ApiResponse.success('Categorías activas encontradas', categories));
  });
}

export { sanitizeCategoryInput };
