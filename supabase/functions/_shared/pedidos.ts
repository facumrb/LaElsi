// ============================================================================
// Lectura de órdenes compartida por las funciones orders y analytics
// ============================================================================
import { sql, type Db } from './db.ts';
import { loadFirstPhotos } from './catalogo.ts';

/**
 * Carga las órdenes indicadas con su cliente y sus líneas (cada línea con su producto y la primera
 * foto del producto), respetando el orden de `ids`.
 *
 * Cada parte trae SOLO lo que muestran las pantallas (ver IApiOrder en el frontend):
 *   - cliente: ID, nombre, email y teléfono. No el DNI, el CUIT ni la dirección: ninguna pantalla los
 *     usa y son datos personales que no hay motivo para repetir dentro de cada orden.
 *   - producto: ID, nombre y marca (no la descripción, el stock ni las ventas).
 *   - fotos: solo la primera de la galería.
 */
// deno-lint-ignore no-explicit-any
export async function loadOrders(ids: number[], db: Db = sql): Promise<any[]> {
  if (ids.length === 0) return [];

  const [orders, lines] = await Promise.all([
    db`
      select id, client_id, status, delivery_method, payment_method, total_amount, date_time, created_at, updated_at
      from "order"
      where id in ${db(ids)}
    `,
    db`
      select id, order_id, product_id, quantity, price
      from order_line
      where order_id in ${db(ids)}
      order by id asc
    `,
  ]);
  if (orders.length === 0) return [];

  // deno-lint-ignore no-explicit-any
  const clientIds = [...new Set<number>(orders.map((o: any) => o.clientId))];
  // deno-lint-ignore no-explicit-any
  const productIds = [...new Set<number>(lines.map((l: any) => l.productId))];

  const [clients, products, firstPhotos] = await Promise.all([
    db`select id, name, last_name, email, phone from "user" where id in ${db(clientIds)}`,
    productIds.length > 0 ? db`select id, name, brand from product where id in ${db(productIds)}` : [],
    loadFirstPhotos(productIds, db),
  ]);

  // deno-lint-ignore no-explicit-any
  const clientsById = new Map<number, any>(clients.map((c: any) => [c.id, c]));
  // deno-lint-ignore no-explicit-any
  const productsById = new Map<number, any>(
    // deno-lint-ignore no-explicit-any
    products.map((p: any) => [p.id, { ...p, photos: firstPhotos.has(p.id) ? [firstPhotos.get(p.id)] : [] }]),
  );
  // deno-lint-ignore no-explicit-any
  const ordersById = new Map<number, any>(orders.map((o: any) => [o.id, o]));

  // deno-lint-ignore no-explicit-any
  const result: any[] = [];
  for (const id of ids) {
    const order = ordersById.get(id);
    if (!order) continue;

    const { clientId, ...rest } = order;
    result.push({
      ...rest,
      client: clientsById.get(clientId) ?? null,
      items: lines
        // deno-lint-ignore no-explicit-any
        .filter((line: any) => line.orderId === id)
        // deno-lint-ignore no-explicit-any
        .map(({ orderId: _orderId, productId, ...line }: any) => ({
          ...line,
          product: productsById.get(productId) ?? null,
        })),
    });
  }
  return result;
}
