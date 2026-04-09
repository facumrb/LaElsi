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
import { OrderState, ProductState } from '../enums/state.enum.js';
import { DeliveryMethod } from '../enums/delivery-method.enum.js';
import { PaymentMethod } from '../enums/payment-method.enum.js';
import { orm } from './orm.js';
import { ADMINS_DATA } from './seed-data/admins.js';
import { CLIENTS_DATA } from './seed-data/clients.js';
import { CATEGORIES_DATA, SUBCATEGORIES_DATA, LEVEL3_CATEGORIES_DATA } from './seed-data/categories.js';
import { PRODUCTS_DATA } from './seed-data/products.js';

const createPhoto = (u: any, fn: string) => Object.assign(new UserPhoto(), { fileName: fn, user: u });

async function seedUsers(em: EntityManager) {
  if (await em.count(Admin, {}) > 0) return;
  for (const d of ADMINS_DATA) {
    const password = await bcrypt.hash(d.password, 10);
    const a = Object.assign(new Admin(), { ...d, role: UserRole.Admin, password });
    if (d.photoFileName) em.persist(createPhoto(a, d.photoFileName));
    em.persist(a);
  }
  for (const d of CLIENTS_DATA) {
    const password = await bcrypt.hash(d.password || 'password123', 10);
    const c = Object.assign(new Client(), { ...d, city: d.city || 'Rosario', province: d.province || 'Santa Fe', postalCode: d.postalCode || '2000', street: d.street || 'Calle Falsa', streetNumber: d.streetNumber || 123, password });
    if (d.photoFileName) em.persist(createPhoto(c, d.photoFileName));
    em.persist(c);
  }
}

async function seedCategories(em: EntityManager) {
  if (await em.count(Category, {}) > 0) return (await em.find(Category, {})).reduce((m, c) => ({ ...m, [c.name]: c }), {});
  const catMap: Record<string, Category> = {};
  for (const d of CATEGORIES_DATA) em.persist(catMap[d.name] = Object.assign(new Category(), d));
  await em.flush();
  const subMap: Record<string, Category> = {};
  for (const d of SUBCATEGORIES_DATA) em.persist(subMap[d.name] = Object.assign(new Category(), { ...d, parent: catMap[d.parentName], depth: 1 }));
  await em.flush();
  for (const d of LEVEL3_CATEGORIES_DATA) em.persist(Object.assign(new Category(), { ...d, parent: subMap[d.parentName], depth: 2 }));
  await em.flush();
  return (await em.find(Category, {})).reduce((m, c) => ({ ...m, [c.name]: c }), {});
}

async function seedProducts(em: EntityManager, catMap: Record<string, Category>) {
  if (await em.count(Product, {}) > 0) return;
  PRODUCTS_DATA.forEach(d => catMap[d.categoryName] && em.persist(createProd(d, catMap[d.categoryName])));
  Object.keys(catMap).forEach(name => {
    const count = PRODUCTS_DATA.filter(p => p.categoryName === name).length;
    for (let i = 1; i <= (20 - count); i++) em.persist(createProd({ name: `${name} Gen ${i}`, price: 1000 + (i * 10) }, catMap[name]));
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
  if (await em.count(Order, {}) > 0) return;
  const clients = await em.find(Client, {});
  const products = await em.find(Product, {}, { populate: ['prices'] });
  const states = Object.values(OrderState);
  for (let i = 0; i < 30; i++) {
    const c = clients[Math.floor(Math.random() * clients.length)];
    const randomStatus = states[Math.floor(Math.random() * states.length)];
    const o = Object.assign(new Order(), { client: c, status: randomStatus, dateTime: new Date(), deliveryMethod: DeliveryMethod.RetiroSucursal, paymentMethod: PaymentMethod.Local, totalAmount: 0 });
    let total = 0;
    for (let j = 0; j < 2; j++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const price = p.prices[0]?.amount || 0;
        o.items.add(Object.assign(new OrderLine(), { order: o, product: p, quantity: 1, price }));
        total += price;
    }
    o.totalAmount = total; em.persist(o);
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
    console.log('🚀 Seed OK: 35 Admins, 35 Clients, 20 Products/Cat, 30 Orders in total.');
  } catch (e) { console.error('❌ Error:', e); }
}
