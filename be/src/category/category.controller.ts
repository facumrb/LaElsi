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
      { populate: ['products'] }
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
      state: req.body.sanitizedInput.state || CategoryState.ACTIVO
    };

    const category = em.create(Category, categoryData as any);
    await em.flush();

    return res.status(201).json(ApiResponse.created('Categoría creada', category));
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const categories = await em.find(Category, {}, { populate: ['products'] });
    return res.status(200).json(ApiResponse.success('Todas las Categorías fueron encontradas', categories));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    const category = await em.findOne(Category, { id }, { populate: ['products'] });

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
    await em.flush();
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
      { state: CategoryState.ACTIVO },
      {
        populate: ['products.photos', 'products.prices'] as any,
        populateWhere: {
          products: { state: ProductState.ACTIVO },
          'products.prices': { isCurrent: true }
        } as any,
        populateOrderBy: { 'products.photos': { order: 'ASC' } } as any
      }
    );
    return res.status(200).json(ApiResponse.success('Categorías activas encontradas', categories));
  });
}

export { sanitizeCategoryInput };
