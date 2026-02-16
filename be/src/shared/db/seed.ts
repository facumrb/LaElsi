import { Admin } from '../../user/admin/admin.entity.js';
import { Client } from '../../user/client/client.entity.js';
import { FiscalCondition } from '../../shared/enums/fiscal-condition.enum.js';
import { UserRole } from '../../user/user.entity.js';
import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';
import { Price } from '../../product/price/price.entity.js';
import { ProductPhoto } from '../../photo/productPhoto/productPhoto.entity.js';
import { Currency } from '../enums/currency.enum.js';
import { orm } from './orm.js';
import { EntityManager } from '@mikro-orm/core';

// --- DATOS CONSTANTES (Configuración) ---

const ADMIN_DATA = {
  name: 'Super',
  lastName: 'Admin',
  dni: '11111111',
  email: 'admin@laelsi.com',
  phone: '123456789',
  username: 'admin',
  password: 'admin123'
};

const CLIENTS_DATA = [
  {
    name: 'Juan',
    lastName: 'Perez',
    dni: '22222222',
    email: 'cliente@laelsi.com',
    phone: '3411111111',
    username: 'cliente',
    password: 'password123',
    role: UserRole.Client,
    fiscalCondition: FiscalCondition.ConsumidorFinal,
    street: 'Av. Pellegrini',
    streetNumber: 1500,
    city: 'Rosario',
    province: 'Santa Fe',
    postalCode: '2000'
  },
  {
    name: 'Empresa',
    lastName: 'Demo S.A.',
    dni: '33333333',
    email: 'empresa@laelsi.com',
    phone: '3412222222',
    username: 'empresa',
    password: 'password123',
    role: UserRole.Client,
    cuit: '20333333339',
    fiscalCondition: FiscalCondition.ResponsableInscripto,
    street: 'Bv. Oroño',
    streetNumber: 500,
    floor: '4',
    apartment: 'B',
    city: 'Rosario',
    province: 'Santa Fe',
    postalCode: '2000'
  }
];

const CATEGORIES_DATA = [
  { name: 'Libreria', description: 'Productos de Libreria' },
  { name: 'Jugueteria', description: 'Productos de Jugueteria' },
  { name: 'Tecnologia', description: 'Productos de Tecnologia' }
];

interface IProductSeed {
  name: string;
  description: string;
  brand: string;
  stock: number;
  categoryName: string;
  price: number;
  totalSold?: number;
  photos: { fileName: string; mimeType: string }[];
}

const PRODUCTS_DATA: IProductSeed[] = [
  {
    name: 'Lápiz HB Classic',
    description: 'Lápiz de grafito HB para escritura graduada y dibujo artístico',
    brand: 'Faber-Castell',
    stock: 120,
    categoryName: 'Libreria',
    price: 350,
    totalSold: 85,
    photos: [
      { fileName: 'lapiz.jpg', mimeType: 'image/jpeg' },
      { fileName: 'lapiz2.jpg', mimeType: 'image/jpeg' }
    ]
  },
  {
    name: 'Cuaderno Universitario Éxito',
    description: 'Cuaderno rayado de 100 hojas tamaño A4 con espiral reforzado',
    brand: 'Éxito',
    stock: 45,
    categoryName: 'Libreria',
    price: 4800,
    totalSold: 32,
    photos: [
      { fileName: 'cuaderno.jpg', mimeType: 'image/jpeg' },
      { fileName: 'cuaderno-a4.jpg', mimeType: 'image/jpeg' }
    ]
  },
  {
    name: 'Goma de Borrar Dos Banderas',
    description: 'Goma blanca de caucho natural, no mancha ni daña el papel',
    brand: 'Dos Banderas',
    stock: 200,
    categoryName: 'Libreria',
    price: 450,
    totalSold: 150,
    photos: [{ fileName: 'goma-de-borrar.png', mimeType: 'image/png' }]
  },
  {
    name: 'Set de Reglas Pizzini',
    description: 'Regla de 30cm técnica de alta precisión, fabricada en poliestireno cristal',
    brand: 'Pizzini',
    stock: 15,
    categoryName: 'Libreria',
    price: 1500,
    totalSold: 210,
    photos: [
      { fileName: 'regla.webp', mimeType: 'image/webp' },
      { fileName: 'regla0.webp', mimeType: 'image/webp' },
      { fileName: 'regla1.webp', mimeType: 'image/webp' },
      { fileName: 'regla2.png', mimeType: 'image/png' },
      { fileName: 'regla3.webp', mimeType: 'image/webp' },
      { fileName: 'regla4.webp', mimeType: 'image/webp' },
      { fileName: 'regla5.jpg', mimeType: 'image/jpeg' },
      { fileName: 'regla6.png', mimeType: 'image/png' },
      { fileName: 'regla7.png', mimeType: 'image/png' },
      { fileName: 'regla8.png', mimeType: 'image/png' }
    ]
  },
  {
    name: 'Remera Algodón Premium',
    description: 'Remera 100% algodón peinado, ideal para personalización o uso diario',
    brand: 'La Elsi',
    stock: 30,
    categoryName: 'Libreria',
    price: 12500,
    totalSold: 18,
    photos: [
      { fileName: 'remeras1.jpeg', mimeType: 'image/jpeg' },
      { fileName: 'remeras2.jpeg', mimeType: 'image/jpeg' },
      { fileName: 'remeras3.jpeg', mimeType: 'image/jpeg' },
      { fileName: 'remeras4.jpeg', mimeType: 'image/jpeg' }
    ]
  }
];

// --------- FUNCIONES DE LÓGICA ---------

async function seedAdmin(em: EntityManager) {
  const adminCount = await em.count(Admin, {});
  if (adminCount > 0) return;

  const superAdmin = new Admin();
  superAdmin.name = ADMIN_DATA.name;
  superAdmin.lastName = ADMIN_DATA.lastName;
  superAdmin.dni = ADMIN_DATA.dni;
  superAdmin.email = ADMIN_DATA.email;
  superAdmin.phone = ADMIN_DATA.phone;
  superAdmin.username = ADMIN_DATA.username;
  superAdmin.role = UserRole.Admin;
  await superAdmin.setPassword(ADMIN_DATA.password);

  em.persist(superAdmin);
}

async function seedClients(em: EntityManager) {
  const clientCount = await em.count(Client, {});
  if (clientCount > 0) return;

  for (const clientData of CLIENTS_DATA) {
    const client = new Client();
    client.name = clientData.name;
    client.lastName = clientData.lastName;
    client.dni = clientData.dni;
    client.email = clientData.email;
    client.phone = clientData.phone;
    client.username = clientData.username;
    client.role = clientData.role;
    await client.setPassword(clientData.password);

    client.fiscalCondition = clientData.fiscalCondition;
    client.street = clientData.street;
    client.streetNumber = clientData.streetNumber;
    client.city = clientData.city;
    client.province = clientData.province;
    client.postalCode = clientData.postalCode;
    if (clientData.cuit) client.cuit = clientData.cuit;
    if (clientData.floor) client.floor = clientData.floor;
    if (clientData.apartment) client.apartment = clientData.apartment;

    em.persist(client);
  }
}

async function seedCategories(em: EntityManager): Promise<Record<string, Category>> {
  const categoryCount = await em.count(Category, {});
  // Mapa para devolver las categorías creadas o encontradas y usarlas en productos
  const categoryMap: Record<string, Category> = {};

  if (categoryCount === 0) {
    for (const catData of CATEGORIES_DATA) {
      const category = new Category();
      category.name = catData.name;
      category.description = catData.description;
      em.persist(category);
      categoryMap[category.name] = category;
    }
  } else {
    // Si ya existen, las buscamos para poder asignar productos si hiciera falta
    const existingCats = await em.find(Category, {});
    existingCats.forEach((c) => (categoryMap[c.name] = c));
  }

  return categoryMap;
}

function createProductEntity(data: IProductSeed, category: Category): Product {
  const product = new Product();
  product.name = data.name;
  product.description = data.description;
  product.brand = data.brand;
  product.totalSold = data.totalSold || 0;
  product.stock = data.stock;
  product.category = category;

  // Crear Precio
  const price = new Price();
  price.amount = data.price;
  price.currency = Currency.ARS;
  price.product = product;
  product.prices.add(price);

  // Crear Fotos (Iteramos el array de fotos data)
  data.photos.forEach((photoData, index) => {
    const photo = new ProductPhoto();
    photo.fileName = photoData.fileName;
    // Asumimos que el original es igual al file si no se especifica
    photo.originalName = photoData.fileName;
    photo.mimeType = photoData.mimeType;
    photo.order = index; // El orden es el índice del array
    photo.product = product;
    product.photos.add(photo);
  });

  return product;
}

// --- FUNCIÓN PRINCIPAL ---

export async function seedDatabase() {
  const em = orm.em.fork();

  try {
    // 1. Admin
    await seedAdmin(em);

    // 2. Clientes
    await seedClients(em);

    // 3. Categorías (Obtenemos el mapa de categorías para usarlo abajo)
    const categoriesMap = await seedCategories(em);

    // 4. Productos
    // Verificamos si la categoría 'Libreria' existe antes de intentar crear productos
    if (categoriesMap['Libreria']) {
      const productCount = await em.count(Product, {});

      if (productCount === 0) {
        for (const prodData of PRODUCTS_DATA) {
          const category = categoriesMap[prodData.categoryName];
          if (category) {
            const product = createProductEntity(prodData, category);
            em.persist(product);
          }
        }
      }
    }

    // 5. Guardar todo junto al final (Transacción implícita)
    await em.flush();
    console.log('🚀 Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('❌ Error ejecutando seedDatabase:', error);
  }
}
