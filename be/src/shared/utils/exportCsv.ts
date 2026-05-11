import { orm } from '../db/orm.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Product } from '../../product/product.entity.js';
import { Client } from '../../user/client/client.entity.js';
import { Order } from '../../order/order.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportToCSV() {
  const em = orm.em.fork();

  // Exportar a la raíz del repositorio (LaElsi/anylogic_data)
  const exportDir = path.resolve(__dirname, '../../../../../anylogic_data');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log('Exportando Products...');
  // 1. Exportar Productos (Top 100 más vendidos para ajustarse a PLE)
  const products = await em.find(Product, {}, {
    orderBy: { totalSold: 'DESC' },
    limit: 100,
    populate: ['category', 'prices']
  });

  let productCsv = 'id,name,category,price,stock,totalSold\n';
  for (const p of products) {
    const currentPriceObj = p.prices.getItems().find(pr => pr.isCurrent);
    const currentPrice = currentPriceObj ? currentPriceObj.amount : 0;
    const catName = p.category?.name || 'Uncategorized';
    productCsv += `${p.id},"${p.name}","${catName}",${currentPrice},${p.stock},${p.totalSold}\n`;
  }
  fs.writeFileSync(path.join(exportDir, 'products.csv'), productCsv);

  console.log('Exportando Clients...');
  // 2. Exportar Clientes (Calculando Frecuencia de Compra)
  const clients = await em.find(Client, {}, { populate: ['orders'] });
  let clientCsv = 'id,frequencyOfPurchase_monthly,totalOrders,daysSinceFirstOrder\n';
  for (const c of clients) {
    const orders = c.orders.getItems().sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    const totalOrders = orders.length;
    let daysSinceFirst = 0;
    let frequency = 0; // Pedidos por mes (estimado)
    if (totalOrders > 0) {
      const first = orders[0].dateTime;
      const last = orders[totalOrders - 1].dateTime;
      const diffTime = Math.abs(last.getTime() - first.getTime());
      daysSinceFirst = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (daysSinceFirst > 0) {
        frequency = (totalOrders / daysSinceFirst) * 30; // Aproximado compras/mes
      } else {
        frequency = totalOrders; // Si todo fue el mismo día
      }
    }
    clientCsv += `${c.id},${frequency.toFixed(2)},${totalOrders},${daysSinceFirst}\n`;
  }
  fs.writeFileSync(path.join(exportDir, 'clients.csv'), clientCsv);

  console.log('Exportando Orders...');
  // 3. Exportar Pedidos (Desglosando totalAmount por categoría y exportando estado)
  const orders = await em.find(Order, {}, { populate: ['items', 'items.product', 'items.product.category'] });
  // Nota: Al pagarse antes de prepararse, el 'status' y la diferencia de dateTime con el presente
  // sirven para calcular la tasa de abandono o cancelación (ej. pedidos que quedan estancados).
  let orderCsv = 'id,dateTime,status,deliveryMethod,paymentMethod,totalAmount,categoryAmounts\n';
  for (const o of orders) {
    const categoryAmounts: Record<string, number> = {};
    for (const item of o.items) {
      const catName = item.product?.category?.name || 'Uncategorized';
      if (!categoryAmounts[catName]) categoryAmounts[catName] = 0;
      categoryAmounts[catName] += Number(item.price) * item.quantity; // Precio histórico de esa línea
    }
    const catString = Object.entries(categoryAmounts).map(([k, v]) => `${k}:${v}`).join('|');
    orderCsv += `${o.id},${o.dateTime.toISOString()},${o.status},${o.deliveryMethod},${o.paymentMethod},${o.totalAmount},"${catString}"\n`;
  }
  fs.writeFileSync(path.join(exportDir, 'orders.csv'), orderCsv);

  console.log('Archivos CSV generados correctamente en:', exportDir);
  await orm.close();
}

exportToCSV().catch(async (e) => {
  console.error('Error generando los CSVs:', e);
  await orm.close();
});
