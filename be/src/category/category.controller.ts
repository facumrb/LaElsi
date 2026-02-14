import { Request, Response, NextFunction } from 'express';
import { Category } from './category.entity.js';
import { orm } from '../shared/db/orm.js';
import { CategoryState, ProductState } from '../shared/enums/state.enum.js';

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

  static async searchCategoriesByText(req: Request, res: Response) {
    const em = orm.em;
    const { query } = req.query;

    try {
      const categories = await em.find(
        Category,
        {
          $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }]
        },
        { populate: ['products'] }
      );
      res.status(200).json({ message: 'Categorías encontradas', data: categories });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async add(req: Request, res: Response): Promise<any> {
    const em = orm.em;
    try {
      const { name, description } = req.body.sanitizedInput;

      if (!name) {
        return res.status(400).json({ message: 'El Nombre de la categoría es requerido' });
      }

      const categoryData = {
        name,
        description,
        state: req.body.sanitizedInput.state || CategoryState.ACTIVO
      };

      const category = em.create(Category, categoryData as any);
      await em.flush();

      res.status(201).json({ message: 'Categoría creada', data: category });
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({ message: 'Error al crear la categoría' });
    }
  }

  static async findAll(req: Request, res: Response) {
    const em = orm.em;
    try {
      const categories = await em.find(Category, {}, { populate: ['products'] });
      res.status(200).json({ message: 'Todas las Categorías fueron encontradas', data: categories });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async findOne(req: Request, res: Response) {
    const em = orm.em;
    try {
      const id = Number.parseInt(req.params.id);
      const category = await em.findOneOrFail(Category, { id }, { populate: ['products'] });
      res.status(200).json({ message: 'Categoría encontrada', data: category });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    const em = orm.em;
    try {
      const id = Number.parseInt(req.params.id);
      const category = await em.findOneOrFail(Category, { id });
      em.assign(category, req.body.sanitizedInput);
      await em.flush();
      res.status(200).json({ message: 'Categoría actualizada', data: category });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async remove(req: Request, res: Response): Promise<any> {
    const em = orm.em;
    try {
      const id = Number.parseInt(req.params.id);
      const category = await em.findOneOrFail(Category, { id }, { populate: ['products'] });

      if (category.products.length > 0) {
        return res.status(400).json({
          message: 'Esta categoría tiene productos asociados.\n\n 💡 Consejo: Cámbia el estado a "Inactivo" en lugar de borrarla.'
        });
      }

      em.remove(category);
      await em.flush();
      res.status(200).send({ message: 'Categoría eliminada' });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        return res.status(404).json({ message: 'La categoría no existe' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async findAllActive(req: Request, res: Response) {
    const em = orm.em;
    try {
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
      res.status(200).json({ message: 'Categorías activas encontradas', data: categories });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export { sanitizeCategoryInput };
