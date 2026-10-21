// ============================================================================
// Edge Function: analytics
// ============================================================================
// Resumen del panel de analíticas del administrador.
//
//   GET /analytics/summary    Solo Admin
//
// Devuelve ya calculado lo que la pantalla muestra: los totales, las últimas órdenes y los
// productos más vendidos. Antes la pantalla pedía tres listados de hasta 100 filas completas
// (órdenes con sus líneas, productos con fotos y precios, clientes) solo para contar, sumar y
// quedarse con cinco. Además de transferir de más, los totales estaban mal en cuanto había más
// de 100 registros: los contadores se topeaban en 100 y los ingresos sumaban únicamente las
// últimas 100 órdenes.
//
// No se creó ninguna vista ni función SQL: son agregados simples (count, sum, top 5) que se
// resuelven con SQL directo desde acá, igual que el resto de las lecturas del proyecto.
// ============================================================================
import { sql } from '../_shared/db.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { ok, serveRoutes, type RequestContext } from '../_shared/http.ts';
import { loadFirstPhotos } from '../_shared/catalogo.ts';
import { loadOrders } from '../_shared/pedidos.ts';

/** Cuántas órdenes recientes y productos destacados muestra la pantalla. */
const TOP_LIMIT = 5;

async function summary(ctx: RequestContext) {
  await requireAdmin(ctx.req);

  const [[totals], recentIds, topProducts] = await Promise.all([
    sql`
      select
        (select count(*)::int from "order") as total_orders,
        -- Ingresos: solo las órdenes pagadas, enviadas o entregadas (no las pendientes ni las canceladas)
        (select coalesce(sum(total_amount), 0) from "order" where status in ('Pagado', 'Enviado', 'Entregado'))
          as total_revenue,
        (select count(*)::int from "user" where role = 'Client') as total_clients,
        (select count(*)::int from product) as total_products
    `,
    sql`select id from "order" order by id desc limit ${TOP_LIMIT}`,
    sql`
      select p.id, p.name, p.total_sold, c.id as category_id, c.name as category_name
      from product p
      join category c on c.id = p.category_id
      where p.total_sold > 0
      order by p.total_sold desc, p.id asc
      limit ${TOP_LIMIT}
    `,
  ]);

  const [recentOrders, firstPhotos] = await Promise.all([
    loadOrders(recentIds.map((row) => row.id as number)),
    loadFirstPhotos(topProducts.map((product) => product.id as number)),
  ]);

  return ok('Resumen de analíticas', {
    totalRevenue: totals.totalRevenue,
    totalOrders: totals.totalOrders,
    totalClients: totals.totalClients,
    totalProducts: totals.totalProducts,
    recentOrders,
    bestSellingProducts: topProducts.map((product) => {
      const photo = firstPhotos.get(product.id as number);
      return {
        id: product.id,
        name: product.name,
        totalSold: product.totalSold,
        category: { id: product.categoryId, name: product.categoryName },
        photos: photo ? [photo] : [],
      };
    }),
  });
}

serveRoutes('analytics', [['GET', '/summary', summary]]);
