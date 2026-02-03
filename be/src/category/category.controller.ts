import { Request, Response, NextFunction } from 'express';
import { Category } from './category.entity.js';
import { orm } from '../shared/db/orm.js';
import { CategoryState } from '../shared/state.enum.js';

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

// Este metodo permite buscar categorías cuyo nombre o descripción contenga el texto proporcionado.
async function searchCategoriesByText(req: Request, res: Response) {
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

async function add(req: Request, res: Response) {
  const em = orm.em;
  try {
    const { name, description } = req.body.sanitizedInput;

    if (!name || !description) {
      return res.status(400).json({ message: 'Nombre y descripción son requeridos' });
    }

    const categoryData = {
      name,
      description,
      state: req.body.sanitizedInput.state || CategoryState.ACTIVO
    };

    const category = em.create(Category, categoryData);
    await em.flush();

    res.status(201).json({ message: 'Categoría creada', data: category });
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ message: 'Error al crear la categoría' });
  }
}

async function findAll(req: Request, res: Response) {
  const em = orm.em;
  try {
    const categories = await em.find(Category, {}, { populate: ['products'] });
    res.status(200).json({ message: 'Todas las Categorías fueron encontradas', data: categories });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  const em = orm.em;
  try {
    const name = req.params.name;
    const category = await em.findOneOrFail(Category, { name }, { populate: ['products'] });
    res.status(200).json({ message: 'Categoría encontrada', data: category });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  const em = orm.em;
  try {
    const nameParam = req.params.name;
    const category = await em.findOneOrFail(Category, { name: nameParam });
    em.assign(category, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'Categoría actualizada', data: category });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  const em = orm.em;
  try {
    const name = req.params.name;
    const category = await em.findOneOrFail(Category, { name }, { populate: ['products'] });

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

export { sanitizeCategoryInput, findAll, findOne, add, update, remove, searchCategoriesByText };
