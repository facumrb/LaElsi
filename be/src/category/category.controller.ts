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
    parentId: req.body.parentId,
    products: req.body.products
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

/**
 * Recorre recursivamente los ancestros de la categoría para verificar si potentialParentId es un ancestro de categoryId.
 * Se utiliza para la detección de ciclos.
 */
async function isAncestor(potentialParentId: number, categoryId: number): Promise<boolean> {
  const em = orm.em;
  const parent = await em.findOne(Category, { id: potentialParentId }, { populate: ['parent'] as any });
  if (!parent || !parent.parent) return false;
  if (parent.parent.id === categoryId) return true;
  return isAncestor(parent.parent.id, categoryId);
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
    const { name, description, parentId } = req.body.sanitizedInput;

    if (!name) {
      throw new AppError('El Nombre de la categoría es requerido', 400);
    }

    let depth = 0;
    let parent = null;

    if (parentId) {
      parent = await em.findOne(Category, { id: Number.parseInt(parentId) });
      if (!parent) {
        throw new AppError('La categoría padre especificada no existe', 404);
      }
      depth = parent.depth + 1;
      if (depth > 2) {
        throw new AppError('Se ha excedido el límite máximo de profundidad (3 niveles)', 400);
      }
    }

    const categoryData: any = {
      name,
      description,
      order: req.body.sanitizedInput.order || 0,
      state: req.body.sanitizedInput.state || CategoryState.Activo,
      depth,
      parent
    };

    const category = em.create(Category, categoryData);
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
    const categories = await em.find(Category, {}, {
      populate: ['children', 'products.photos'],
      orderBy: { parent: { id: 'ASC' }, order: 'ASC', name: 'ASC' } as any
    });
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
    const category = await em.findOne(Category, { id }, { populate: ['children'] });

    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    const { parentId } = req.body.sanitizedInput;
    if (parentId !== undefined) {
      const newParentId = parentId ? Number.parseInt(parentId) : null;
      const currentParentId = category.parent?.id || null;

      if (newParentId !== currentParentId) {
        if (newParentId === category.id) {
          throw new AppError('Una categoría no puede ser su propio padre', 400);
        }

        let newDepth = 0;
        let newParent = null;

        if (newParentId) {
          // Detección de ciclo: corroborar que el nuevo padre es ancestro o que la cateogoría es el ancestro de un nuevo padre
          const cycleFound = await isAncestor(newParentId, category.id);
          if (cycleFound) {
            throw new AppError('Asignación de padre inválida: crearía un ciclo circular', 400);
          }

          newParent = await em.findOne(Category, { id: newParentId });
          if (!newParent) {
            throw new AppError('La categoría padre especificada no existe', 404);
          }
          newDepth = newParent.depth + 1;
          if (newDepth > 2) {
            throw new AppError('Se ha excedido el límite máximo de profundidad (3 niveles)', 400);
          }
        }

        // Update depth for this category and all its descendants
        const depthDiff = newDepth - category.depth;
        category.depth = newDepth;
        category.parent = newParent as any;

        if (depthDiff !== 0) {
          const updateDescendantsDepth = async (cat: Category, diff: number) => {
            for (const child of cat.children) {
              await em.populate(child, ['children']);
              child.depth += diff;
              if (child.depth > 2) {
                throw new AppError('La operación resultaría en una profundidad mayor a 3 niveles para algunas subcategorías', 400);
              }
              await updateDescendantsDepth(child, diff);
            }
          };
          await updateDescendantsDepth(category, depthDiff);
        }
      }
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
    const category = await em.findOne(Category, { id }, { populate: ['products', 'children'] });

    if (!category) {
      throw new AppError('La categoría no existe', 404);
    }

    if (category.children.length > 0) {
      throw new AppError('Esta categoría tiene subcategorías asociadas. Debes reasignarlas o eliminarlas primero.', 400);
    }

    if (category.products.length > 0) {
      throw new AppError('Esta categoría tiene productos asociados.\n\n 💡 Consejo: Cámbia el estado a "Inactivo" en lugar de borrarla.', 400);
    }

    em.remove(category);
    await em.flush();
    return res.status(200).json(ApiResponse.success('Categoría eliminada'));
  });

  static getTree = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const depthLimit = req.query.depth ? Number.parseInt(req.query.depth as string) : 5;
    const state = req.query.state as string;

    const filter: any = { parent: null };
    if (state) {
      filter.state = state;
    }

    const populateFields = [];
    let currentPopulate = 'children';
    for (let i = 0; i < depthLimit; i++) {
      populateFields.push(currentPopulate);
      currentPopulate += '.children';
    }

    const categories = await em.find(Category, filter, {
      populate: populateFields as any,
      orderBy: { order: 'ASC', name: 'ASC' }
    });

    return res.status(200).json(ApiResponse.success('Árbol de categorías obtenido', categories));
  });

  static getChildren = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    const children = await em.find(Category, { parent: id }, {
      populate: ['children'],
      orderBy: { order: 'ASC', name: 'ASC' }
    });

    return res.status(200).json(ApiResponse.success('Subcategorías encontradas', children));
  });

  static findAllActive = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const categories = await em.find(
      Category,
      {
        state: CategoryState.Activo,
        parent: null
      },
      {
        populate: ['children.children', 'products.photos', 'products.prices'],
        orderBy: { order: 'ASC', name: 'ASC', products: { photos: { order: 'ASC' } } }
      }
    );
    return res.status(200).json(ApiResponse.success('Categorías activas encontradas', categories));
  });
}

export { sanitizeCategoryInput };
