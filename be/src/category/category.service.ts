import { Category } from './category.entity.js';
import { orm } from '../shared/db/orm.js';
import { CategoryState } from '../shared/enums/state.enum.js';
import { AppError } from '../shared/errors/appError.js';

export class CategoryService {
  /**
   * Recorre recursivamente los ancestros de la categoría para verificar si potentialParentId es un ancestro de categoryId.
   * Útil para detectar ciclos circulares.
   */
  private static async isAncestor(potentialParentId: number, categoryId: number): Promise<boolean> {
    const em = orm.em;
    const parent = await em.findOne(Category, { id: potentialParentId }, { populate: ['parent'] as any });
    if (!parent || !parent.parent) return false;
    if (parent.parent.id === categoryId) return true;
    return this.isAncestor(parent.parent.id, categoryId);
  }

  static async searchCategoriesByText(query: string) {
    const em = orm.em;
    return em.find(
      Category,
      {
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }]
      },
      { populate: ['products.photos'] }
    );
  }

  static async addCategory(data: Partial<Category> & { parentId?: number }) {
    const em = orm.em;
    if (!data.name) {
      throw new AppError('El Nombre de la categoría es requerido', 400);
    }

    let depth = 0;
    let parent = null;

    if (data.parentId) {
      parent = await em.findOne(Category, { id: data.parentId });
      if (!parent) {
        throw new AppError('La categoría padre especificada no existe', 404);
      }
      depth = parent.depth + 1;
      if (depth > 2) {
        throw new AppError('Se ha excedido el límite máximo de profundidad (3 niveles)', 400);
      }
    }

    const categoryData: any = {
      name: data.name,
      description: data.description,
      order: data.order || 0,
      state: data.state || CategoryState.Activo,
      depth,
      parent
    };

    const category = em.create(Category, categoryData);
    try {
      await em.flush();
      return category;
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  static async findAll() {
    const em = orm.em;
    return em.find(Category, {}, {
      populate: ['children', 'products.photos'],
      orderBy: { parent: { id: 'ASC' }, order: 'ASC', name: 'ASC' } as any
    });
  }

  static async findOne(id: number) {
    const em = orm.em;
    const category = await em.findOne(Category, { id }, { populate: ['products.photos'] });
    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }
    return category;
  }

  static async updateCategory(id: number, data: Partial<Category> & { parentId?: number | null }) {
    const em = orm.em;
    const category = await em.findOne(Category, { id }, { populate: ['children'] });

    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    if (data.parentId !== undefined) {
      const newParentId = data.parentId ? data.parentId : null;
      const currentParentId = category.parent?.id || null;

      if (newParentId !== currentParentId) {
        if (newParentId === category.id) {
          throw new AppError('Una categoría no puede ser su propio padre', 400);
        }

        let newDepth = 0;
        let newParent = null;

        if (newParentId) {
          const cycleFound = await this.isAncestor(newParentId, category.id);
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

        const depthDiff = newDepth - category.depth;
        category.depth = newDepth;
        category.parent = newParent as any;

        if (depthDiff !== 0) {
          await this.updateDescendantsDepth(category, depthDiff);
        }
      }
    }

    // Clean data object before assigning
    const { parentId, ...updateData } = data;
    em.assign(category, updateData);
    
    try {
      await em.flush();
      return category;
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  private static async updateDescendantsDepth(cat: Category, diff: number) {
    const em = orm.em;
    for (const child of cat.children) {
      await em.populate(child, ['children']);
      child.depth += diff;
      if (child.depth > 2) {
        throw new AppError('La operación resultaría en una profundidad mayor a 3 niveles para algunas subcategorías', 400);
      }
      await this.updateDescendantsDepth(child, diff);
    }
  }

  static async removeCategory(id: number) {
    const em = orm.em;
    const category = await em.findOne(Category, { id }, { populate: ['products', 'children'] });

    if (!category) {
      throw new AppError('La categoría no existe', 404);
    }

    if (category.children.length > 0) {
      throw new AppError('Esta categoría tiene subcategorías asociadas. Debes reasignarlas o eliminarlas primero.', 400);
    }

    if (category.products.length > 0) {
      throw new AppError('Esta categoría tiene productos asociados.\\n\\n 💡 Consejo: Cámbia el estado a "Inactivo" en lugar de borrarla.', 400);
    }

    em.remove(category);
    await em.flush();
  }

  static async getTree(depthLimit: number = 5, state?: string) {
    const em = orm.em;
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

    return em.find(Category, filter, {
      populate: populateFields as any,
      orderBy: { order: 'ASC', name: 'ASC' }
    });
  }

  static async getChildren(parentId: number) {
    const em = orm.em;
    return em.find(Category, { parent: parentId }, {
      populate: ['children'],
      orderBy: { order: 'ASC', name: 'ASC' }
    });
  }

  static async findAllActive() {
    const em = orm.em;
    return em.find(
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
  }

  private static handleUniqueConstraintError(error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      throw new AppError('Ya existe una categoría con este nombre', 409);
    }
  }
}
