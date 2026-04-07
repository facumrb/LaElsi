import { Category } from './category.entity.js';
import { orm } from '../shared/db/orm.js';
import { CategoryState, ProductState } from '../shared/enums/state.enum.js';
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

  /**
   * Desplaza el orden de las categorías de un nivel a partir de una posición inicial.
   */
  private static async shiftPeers(parentId: number | null, fromOrder: number, delta: number) {
    const em = orm.em;
    const peers = await em.find(Category, {
      parent: parentId,
      order: { $gte: fromOrder }
    });
    for (const peer of peers) {
      peer.order += delta;
    }
  }

  /**
   * Desplaza el orden de las categorías en un rango específico.
   */
  private static async shiftPeersBetween(parentId: number | null, from: number, to: number, delta: number) {
    const em = orm.em;
    const peers = await em.find(Category, {
      parent: parentId,
      order: { $gte: from, $lte: to }
    });
    for (const peer of peers) {
      peer.order += delta;
    }
  }

  static async searchCategoriesByText(query: string) {
    const em = orm.em;
    const categories = await em.find(
      Category,
      {
        state: CategoryState.Activo,
        $or: [{ name: { $like: `%${query}%` } }, { description: { $like: `%${query}%` } }]
      },
      { populate: ['products.photos'] }
    );

    // Filtrar categorías que no tienen productos activos en su subárbol
    const filtered: Category[] = [];
    for (const cat of categories) {
      if (await this.hasActiveProductsInSubtree(cat.id)) {
        filtered.push(cat);
      }
    }
    return filtered;
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

    let order = data.order;
    if (order === undefined) {
      const lastPeer = await em.findOne(Category, { parent: parent?.id ?? null }, { orderBy: { order: 'DESC' } as any });
      order = lastPeer ? lastPeer.order + 1 : 1;
    } else {
      // Abrir hueco en el nivel correspondiente
      await this.shiftPeers(parent?.id ?? null, order, 1);
    }

    const categoryData: any = {
      name: data.name,
      description: data.description,
      order,
      state: data.state || CategoryState.Activo,
      depth,
      parent,
      deletedAt: data.state === CategoryState.Inactivo ? new Date() : undefined
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
    return em.find(
      Category,
      {},
      {
        populate: ['children', 'parent', 'products.photos'] as any,
        orderBy: { order: 'ASC', name: 'ASC' } as any
      }
    );
  }

  static async findOne(id: number) {
    const em = orm.em;
    const category = await em.findOne(Category, { id }, { populate: ['products.photos', 'parent.parent'] as any });
    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }
    return category;
  }

  static async updateCategory(id: number, data: Partial<Category> & { parentId?: number | null }) {
    const em = orm.em;
    const category = await em.findOne(Category, { id }, { populate: ['children', 'parent'] as any });

    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    const oldParentId = (category.parent as any)?.id ?? null;
    const newParentId = data.parentId !== undefined ? data.parentId || null : oldParentId;
    const oldOrder = category.order;

    // 1. Manejo de cambio de nivel / padre
    if (newParentId !== oldParentId) {
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

      // Cerrar hueco en el padre anterior (mover los de orden > oldOrder, un lugar hacia arriba)
      await this.shiftPeers(oldParentId, oldOrder + 1, -1);

      let newOrder = data.order;
      if (newOrder === undefined) {
        const lastPeer = await em.findOne(Category, { parent: newParentId }, { orderBy: { order: 'DESC' } as any });
        newOrder = lastPeer ? lastPeer.order + 1 : 1;
      } else {
        // Abrir hueco en el nuevo padre
        await this.shiftPeers(newParentId, newOrder, 1);
      }

      const depthDiff = newDepth - category.depth;
      category.depth = newDepth;
      category.parent = newParent as any;
      category.order = newOrder;

      if (depthDiff !== 0) {
        await this.updateDescendantsDepth(category, depthDiff);
      }
    }
    // 2. Cambio de orden en el MISMO nivel
    else if (data.order !== undefined && data.order !== oldOrder) {
      const newOrder = data.order;
      if (newOrder < oldOrder) {
        // Mover hacia arriba: desplazar intermedios hacia abajo
        await this.shiftPeersBetween(newParentId, newOrder, oldOrder - 1, 1);
      } else {
        // Mover hacia abajo: desplazar intermedios hacia arriba
        await this.shiftPeersBetween(newParentId, oldOrder + 1, newOrder, -1);
      }
      category.order = newOrder;
    }

    // Asignar el resto de los datos
    const { parentId, order: _order, ...updateData } = data;
    const oldState = category.state;
    em.assign(category, updateData);

    if (category.state !== oldState) {
      if (category.state === CategoryState.Activo) {
        const hasActive = await this.hasActiveProductsInSubtree(category.id);
        if (!hasActive) {
          throw new AppError('No se puede activar una categoría que no tiene productos activos ni subcategorías con productos.', 400);
        }
      }
      category.deletedAt = category.state === CategoryState.Inactivo ? new Date() : undefined;
    }

    try {
      await em.flush();
      return category;
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }
  }

  private static async updateDescendantsDepth(cat: Category, diff: number, txEm?: any) {
    const em = txEm ?? orm.em;
    for (const child of cat.children) {
      await em.populate(child, ['children']);
      child.depth += diff;
      if (child.depth > 2) {
        throw new AppError('La operación resultaría en una profundidad mayor a 3 niveles para algunas subcategorías', 400);
      }
      await this.updateDescendantsDepth(child, diff, em);
    }
  }

  static async bulkUpdateOrderAndParent(updates: { id: number; order: number; parentId: number | null }[]) {
    return await orm.em.transactional(async (em) => {
      for (const update of updates) {
        const category = await em.findOne(Category, { id: update.id }, { populate: ['parent', 'children'] as any });
        if (!category) throw new AppError(`Categoría no encontrada (ID: ${update.id})`, 404);

        let newDepth = 0;
        let newParent = null;

        if (update.parentId) {
          if (update.parentId === category.id) {
            throw new AppError(`Una categoría no puede ser su propio padre (ID: ${category.id})`, 400);
          }

          let currentId: number | null = update.parentId;
          while (currentId !== null) {
            if (currentId === category.id) throw new AppError(`Asignación inválida: se detectó un ciclo circular`, 400);
            const parentCat: any = await em.findOne(Category, { id: currentId }, { populate: ['parent'] as any });
            currentId = parentCat?.parent?.id ?? null;
          }

          newParent = await em.findOne(Category, { id: update.parentId });
          if (!newParent) {
            throw new AppError(`La categoría padre especificada no existe (ID: ${update.parentId})`, 404);
          }
          newDepth = newParent.depth + 1;
          if (newDepth > 2) {
            throw new AppError('Se ha excedido el límite máximo de profundidad (3 niveles)', 400);
          }
        }

        const depthDiff = newDepth - category.depth;
        category.depth = newDepth;
        category.parent = newParent as any;
        category.order = update.order;

        if (depthDiff !== 0) {
          await this.updateDescendantsDepth(category, depthDiff, em);
        }
      }
      return true;
    });
  }

  static async removeCategory(id: number) {
    const em = orm.em;
    const category = await em.findOne(Category, { id }, { populate: ['products', 'children', 'parent'] as any });

    if (!category) {
      throw new AppError('La categoría no existe', 404);
    }

    if (category.children.length > 0) {
      throw new AppError('Esta categoría tiene subcategorías asociadas. Debes reasignarlas o eliminarlas primero.', 400);
    }

    if (category.products.length > 0) {
      throw new AppError('Esta categoría tiene productos asociados.\n\n 💡 Consejo: Cámbia el estado a "Inactivo" en lugar de borrarla.', 400);
    }

    const currentOrder = category.order;
    const parentId = (category.parent as any)?.id ?? null;

    em.remove(category);

    // Cerrar hueco tras la eliminación
    await this.shiftPeers(parentId, currentOrder + 1, -1);

    await em.flush();
  }

  static async getTree(depthLimit: number = 5, state?: string) {
    const em = orm.em;
    const filter: any = { parent: null };
    if (state) {
      filter.state = state;
    }

    // Populate simple y recursivo para hijos de hijos
    const populatePaths: string[] = [];
    let path = 'children';
    for (let i = 0; i < depthLimit; i++) {
      populatePaths.push(path);
      path += '.children';
    }

    // Si se filtra por estado, filtrar también los children en cada nivel
    const options: any = {
      populate: populatePaths as any,
      orderBy: { order: 'ASC', name: 'ASC' }
    };
    if (state === CategoryState.Activo) {
      options.populateWhere = { state: CategoryState.Activo };
    }

    const categories = await em.find(Category, filter, options);

    // Filtrar categorías que no tienen productos activos en su subárbol
    if (state === CategoryState.Activo) {
      const filterActiveChildren = (category: Category) => {
        if (category.children && category.children.isInitialized()) {
          const activeItems = category.children.getItems().filter((c) => c.state === CategoryState.Activo);
          for (const item of activeItems) filterActiveChildren(item);
          category.children.set(activeItems);
        }
      };

      const filtered: Category[] = [];
      for (const cat of categories) {
        if (await this.hasActiveProductsInSubtree(cat.id)) {
          filterActiveChildren(cat);
          filtered.push(cat);
        }
      }
      return filtered;
    }

    return categories;
  }

  static async getChildren(parentId: number) {
    const em = orm.em;
    return em.find(
      Category,
      { parent: parentId },
      {
        populate: ['children'],
        orderBy: { order: 'ASC', name: 'ASC' }
      }
    );
  }

  static async findAllActive() {
    const em = orm.em;
    const categories = await em.find(
      Category,
      {
        state: CategoryState.Activo,
        parent: null
      },
      {
        populate: ['children.children', 'products.photos', 'products.prices'],
        populateWhere: { state: CategoryState.Activo, products: { state: ProductState.Activo } },
        orderBy: { order: 'ASC', name: 'ASC', products: { photos: { order: 'ASC' } } }
      }
    );

    // Filtrar subcategorías que tengan estado inactivo
    const filterActiveChildren = (category: Category) => {
      if (category.children && category.children.isInitialized()) {
        const activeItems = category.children.getItems().filter((c) => c.state === CategoryState.Activo);
        for (const item of activeItems) filterActiveChildren(item);
        category.children.set(activeItems);
      }
    };

    // Filtrar categorías que no tienen productos activos en su subárbol
    const filtered: Category[] = [];
    for (const cat of categories) {
      if (await this.hasActiveProductsInSubtree(cat.id)) {
        filterActiveChildren(cat);
        filtered.push(cat);
      }
    }
    return filtered;
  }

  /**
   * Verifica si una categoría (y su subárbol) tiene al menos un producto activo.
   */
  static async hasActiveProductsInSubtree(categoryId: number): Promise<boolean> {
    const em = orm.em;
    const { Product } = await import('../product/product.entity.js');

    // Verificar productos directos activos
    const directCount = await em.count(Product, {
      category: categoryId,
      state: ProductState.Activo
    });
    if (directCount > 0) return true;

    // Verificar en subcategorías recursivamente
    const children = await em.find(Category, { parent: categoryId });
    for (const child of children) {
      const childHas = await this.hasActiveProductsInSubtree(child.id);
      if (childHas) return true;
    }

    return false;
  }

  /**
   * Desactiva una categoría si no tiene productos activos en su subárbol.
   * Luego verifica recursivamente a los padres.
   */
  static async checkAndDeactivateCategory(categoryId: number) {
    const em = orm.em;
    const category = await em.findOne(Category, { id: categoryId }, { populate: ['parent'] as any });

    if (!category || category.state === CategoryState.Inactivo) return;

    const hasActive = await this.hasActiveProductsInSubtree(categoryId);
    if (!hasActive) {
      category.state = CategoryState.Inactivo;
      category.deletedAt = new Date();
      await em.flush();

      // Verificar padre recursivamente
      if (category.parent) {
        await this.checkAndDeactivateCategory((category.parent as any).id);
      }
    }
  }

  private static handleUniqueConstraintError(error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      throw new AppError('Ya existe una categoría con este nombre', 409);
    }
  }
}
