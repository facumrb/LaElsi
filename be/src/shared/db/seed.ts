import bcrypt from 'bcrypt';
import { EntityManager } from '@mikro-orm/core';
import { Admin } from '../../user/admin/admin.entity.js';
import { Client } from '../../user/client/client.entity.js';
import { UserRole } from '../../user/user.entity.js';
import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';
import { Price } from '../../product/price/price.entity.js';
import { ProductPhoto } from '../../photo/productPhoto/productPhoto.entity.js';
import { UserPhoto } from '../../photo/userPhoto/userPhoto.entity.js';
import { Order } from '../../order/order.entity.js';
import { OrderLine } from '../../order/order-line.entity.js';
import { Currency } from '../enums/currency.enum.js';
import { ProductState } from '../enums/state.enum.js';
import { orm } from './orm.js';
import { ADMINS_DATA } from './seed-data/admins.js';
import { CLIENTS_DATA } from './seed-data/clients.js';
import { CATEGORIES_DATA, SUBCATEGORIES_DATA, LEVEL3_CATEGORIES_DATA } from './seed-data/categories.js';
import { PRODUCTS_DATA } from './seed-data/products.js';

const createPhoto = (u: any, fn: string) => Object.assign(new UserPhoto(), { fileName: fn, user: u });

async function seedUsers(em: EntityManager) {
  if ((await em.count(Admin, {})) > 0) return;
  for (const d of ADMINS_DATA) {
    const password = await bcrypt.hash(d.password, 10);
    const a = Object.assign(new Admin(), { ...d, role: UserRole.Admin, password });
    if (d.photoFileName) em.persist(createPhoto(a, d.photoFileName));
    em.persist(a);
  }
  for (const d of CLIENTS_DATA) {
    const password = await bcrypt.hash(d.password || 'password123', 10);
    const c = Object.assign(new Client(), {
      ...d,
      city: d.city || 'Rosario',
      province: d.province || 'Santa Fe',
      postalCode: d.postalCode || '2000',
      street: d.street || 'Calle Falsa',
      streetNumber: d.streetNumber || 123,
      password
    });
    if (d.photoFileName) em.persist(createPhoto(c, d.photoFileName));
    em.persist(c);
  }
}

async function seedCategories(em: EntityManager) {
  if ((await em.count(Category, {})) > 0) return (await em.find(Category, {})).reduce((m, c) => ({ ...m, [c.name]: c }), {});
  const catMap: Record<string, Category> = {};
  for (const d of CATEGORIES_DATA) em.persist((catMap[d.name] = Object.assign(new Category(), d)));
  await em.flush();
  const subMap: Record<string, Category> = {};
  for (const d of SUBCATEGORIES_DATA) em.persist((subMap[d.name] = Object.assign(new Category(), { ...d, parent: catMap[d.parentName], depth: 1 })));
  await em.flush();
  for (const d of LEVEL3_CATEGORIES_DATA) em.persist(Object.assign(new Category(), { ...d, parent: subMap[d.parentName], depth: 2 }));
  await em.flush();
  return (await em.find(Category, {})).reduce((m, c) => ({ ...m, [c.name]: c }), {});
}

async function seedProducts(em: EntityManager, catMap: Record<string, Category>) {
  if ((await em.count(Product, {})) > 0) return;
  PRODUCTS_DATA.forEach((d) => catMap[d.categoryName] && em.persist(createProd(d, catMap[d.categoryName])));
  Object.keys(catMap).forEach((name) => {
    const count = PRODUCTS_DATA.filter((p) => p.categoryName === name).length;
    for (let i = 1; i <= 20 - count; i++) em.persist(createProd({ name: `${name} Gen ${i}`, price: 1000 + i * 10 }, catMap[name]));
  });
}

function createProd(d: any, cat: Category) {
  const { photos, ...rest } = d;
  const p = Object.assign(new Product(), { brand: 'Generic', description: 'Descripción por defecto', stock: 50, state: ProductState.Activo, ...rest, category: cat });
  p.prices.add(Object.assign(new Price(), { amount: d.price, currency: Currency.ARS, product: p }));
  if (photos) {
    photos.forEach((f: any, i: number) => p.photos.add(Object.assign(new ProductPhoto(), { fileName: f.fileName, order: i, product: p })));
  }
  return p;
}

async function seedOrders(em: EntityManager) {
  if ((await em.count(Order, {})) > 0) return;

  const { ORDERS_DATA } = await import('./seed-data/orders.js');
  const clients = await em.find(Client, {});
  const products = await em.find(Product, {}, { populate: ['prices'] });

  const clientMap = clients.reduce((m, c) => ({ ...m, [c.username]: c }), {} as Record<string, Client>);
  const productMap = products.reduce((m, p) => ({ ...m, [p.name]: p }), {} as Record<string, Product>);

  for (const orderData of ORDERS_DATA) {
    const client = clientMap[orderData.clientUsername];
    if (!client) {
      console.warn(`⚠️ Seed: Cliente "${orderData.clientUsername}" no encontrado, omitiendo orden.`);
      continue;
    }

    const order = Object.assign(new Order(), {
      client,
      status: orderData.status,
      deliveryMethod: orderData.deliveryMethod,
      paymentMethod: orderData.paymentMethod,
      dateTime: orderData.dateTime,
      totalAmount: 0
    });

    let total = 0;
    for (const item of orderData.items) {
      const product = productMap[item.productName];
      if (!product) {
        console.warn(`⚠️ Seed: Producto "${item.productName}" no encontrado, omitiendo línea.`);
        continue;
      }
      const price = product.prices[0]?.amount || 0;
      order.items.add(
        Object.assign(new OrderLine(), {
          order,
          product,
          quantity: item.quantity,
          price
        })
      );
      total += price * item.quantity;
    }

    order.totalAmount = total;
    em.persist(order);
  }
}

export async function seedDatabase() {
  const em = orm.em.fork();
  try {
    await seedUsers(em);
    const catMap = await seedCategories(em);
    await seedProducts(em, catMap);
    await em.flush();
    await seedOrders(em);
    await em.flush();
    console.log('🚀 Seed OK: Admins, Clients, Products, 50 Orders loaded.');
  } catch (e) {
    console.error('❌ Error:', e);
  }
}
