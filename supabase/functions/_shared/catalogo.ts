// ============================================================================
// Helpers del catálogo compartidos por las funciones de categorías, productos y órdenes
// ============================================================================
// Arman las mismas estructuras anidadas que devolvía MikroORM con `populate`:
//   producto -> { category (con sus padres), photos[], prices[] }
// ============================================================================
import { sql, type Db } from './db.ts';
import { paginated } from './http.ts';

export interface CategoryRow {
  id: number;
  name: string;
  description: string | null;
  order: number;
  state: 'Activo' | 'Inactivo';
  parentId: number | null;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ─── Categorías ──────────────────────────────────────────────────────────────

/**
 * Trae TODAS las categorías ordenadas. La tabla es chica (decenas de filas), así
 * que conviene cargarla completa y resolver la jerarquía en memoria en vez de
 * hacer una consulta recursiva por cada nivel.
 */
export async function loadCategories(db: Db = sql): Promise<CategoryRow[]> {
  return await db`select * from category order by "order" asc, name asc`;
}

export function indexById(categories: CategoryRow[]): Map<number, CategoryRow> {
  return new Map(categories.map((c) => [c.id, c]));
}

/** Agrupa las categorías por su padre (la clave null agrupa a las raíces). */
export function groupByParent(categories: CategoryRow[]): Map<number | null, CategoryRow[]> {
  const groups = new Map<number | null, CategoryRow[]>();
  for (const category of categories) {
    const siblings = groups.get(category.parentId) ?? [];
    siblings.push(category);
    groups.set(category.parentId, siblings);
  }
  return groups;
}

/** Devuelve la categoría con sus ancestros anidados en `parent` (sirve para los breadcrumbs). */
// deno-lint-ignore no-explicit-any
export function withParents(category: CategoryRow, byId: Map<number, CategoryRow>): any {
  const parent = category.parentId !== null ? byId.get(category.parentId) : undefined;
  return { ...category, parent: parent ? withParents(parent, byId) : null };
}

/** Cantidad de productos activos que tiene DIRECTAMENTE cada categoría. */
export async function loadActiveProductCounts(db: Db = sql): Promise<Map<number, number>> {
  const rows = await db`
    select category_id, count(*)::int as total
    from product
    where state = 'Activo'
    group by category_id
  `;
  // deno-lint-ignore no-explicit-any
  return new Map(rows.map((r: any) => [r.categoryId as number, r.total as number]));
}

/** Verifica si una categoría (o alguna de su subárbol) tiene al menos un producto activo. */
export function hasActiveProductsInSubtree(
  categoryId: number,
  byParent: Map<number | null, CategoryRow[]>,
  activeCounts: Map<number, number>,
): boolean {
  if ((activeCounts.get(categoryId) ?? 0) > 0) return true;
  return (byParent.get(categoryId) ?? []).some((child) =>
    hasActiveProductsInSubtree(child.id, byParent, activeCounts),
  );
}

/**
 * Desactiva una categoría si no le quedan productos activos en su subárbol.
 * Luego repite la verificación hacia arriba con cada padre.
 */
export async function checkAndDeactivateCategory(categoryId: number, db: Db = sql): Promise<void> {
  const categories = await loadCategories(db);
  const byId = indexById(categories);
  const byParent = groupByParent(categories);
  const activeCounts = await loadActiveProductCounts(db);

  let current = byId.get(categoryId);
  while (current && current.state === 'Activo') {
    if (hasActiveProductsInSubtree(current.id, byParent, activeCounts)) return;

    await db`update category set state = 'Inactivo', deleted_at = now() where id = ${current.id}`;
    current.state = 'Inactivo';

    // Verificar padre
    current = current.parentId !== null ? byId.get(current.parentId) : undefined;
  }
}

// ─── Productos ───────────────────────────────────────────────────────────────

/**
 * Carga los productos indicados con su categoría, fotos y precios, respetando
 * el orden de `ids`.
 *
 * @param onlyCurrentPrices true para la tienda (solo el precio vigente);
 *                          false para el panel admin (historial completo).
 */
export async function loadProducts(
  ids: number[],
  options: { onlyCurrentPrices?: boolean } = {},
  db: Db = sql,
  // deno-lint-ignore no-explicit-any
): Promise<any[]> {
  if (ids.length === 0) return [];

  const [products, photos, prices, categories] = await Promise.all([
    db`select * from product where id in ${db(ids)}`,
    db`
      select id, file_name, "order", product_id
      from photo
      where product_id in ${db(ids)}
      order by "order" asc, id asc
    `,
    options.onlyCurrentPrices
      ? db`
          select id, amount, currency, valid_from, is_current, product_id
          from price
          where product_id in ${db(ids)} and is_current
        `
      : db`
          select id, amount, currency, valid_from, is_current, product_id
          from price
          where product_id in ${db(ids)}
          order by valid_from asc, id asc
        `,
    loadCategories(db),
  ]);

  const categoriesById = indexById(categories);
  // deno-lint-ignore no-explicit-any
  const productsById = new Map<number, any>(products.map((p: any) => [p.id, p]));

  // deno-lint-ignore no-explicit-any
  const result: any[] = [];
  for (const id of ids) {
    const product = productsById.get(id);
    if (!product) continue;

    const { categoryId, ...rest } = product;
    const category = categoriesById.get(categoryId);
    result.push({
      ...rest,
      category: category ? withParents(category, categoriesById) : null,
      // deno-lint-ignore no-explicit-any
      photos: photos.filter((photo: any) => photo.productId === id),
      // deno-lint-ignore no-explicit-any
      prices: prices.filter((price: any) => price.productId === id),
    });
  }
  return result;
}

/**
 * Lista productos paginados.
 *
 * `where` y `orderBy` son funciones que devuelven un fragmento SQL nuevo cada
 * vez, porque el mismo filtro se usa en dos consultas (la página y el total).
 * En ambas están disponibles los alias: p (product), c (category) y cp (precio vigente).
 */
export async function paginateProducts(options: {
  // deno-lint-ignore no-explicit-any
  where: () => any;
  // deno-lint-ignore no-explicit-any
  orderBy: () => any;
  page: number;
  limit: number;
  onlyCurrentPrices?: boolean;
}) {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  const rows = await sql`
    select p.id
    from product p
    join category c on c.id = p.category_id
    left join price cp on cp.product_id = p.id and cp.is_current
    where ${options.where()}
    order by ${options.orderBy()}
    limit ${limit} offset ${offset}
  `;

  const [{ total }] = await sql`
    select count(*)::int as total
    from product p
    join category c on c.id = p.category_id
    where ${options.where()}
  `;

  const data = await loadProducts(
    // deno-lint-ignore no-explicit-any
    rows.map((r: any) => r.id),
    { onlyCurrentPrices: options.onlyCurrentPrices },
  );

  return paginated(data, total, page, limit);
}

/** Convierte el texto de búsqueda en un patrón para ILIKE (búsqueda parcial sin distinguir mayúsculas). */
export function likePattern(text: string): string {
  return `%${text}%`;
}
