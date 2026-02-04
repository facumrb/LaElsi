import { EntityManager } from '@mikro-orm/core';
import { Admin } from '../../user/admin/admin.entity.js'; // Verifica que esta ruta sea correcta
import { UserRole } from '../../user/user.entity.js'; // Verifica que esta ruta sea correcta
import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';
import { Price } from '../../product/price/price.entity.js';
import { ProductPhoto } from '../../photo/productPhoto/productPhoto.entity.js';
import { Currency } from '../currency.enum.js';

export async function seedDatabase(em: EntityManager) {
  try {
    // Usamos un fork para tener un contexto limpio
    const forkEm = em.fork();

    // 1. Verificamos si ya existen admins
    const adminCount = await forkEm.count(Admin, {});

    if (adminCount > 0) {
      // Si ya hay admins, no hacemos nada para no duplicar ni reiniciar passwords
      return;
    }

    console.log('🌱 Base de datos sin Admins. Creando Super Admin...');

    // 2. Crear el Admin por defecto
    const superAdmin = new Admin();
    superAdmin.name = 'Super';
    superAdmin.last_name = 'Admin';
    superAdmin.email = 'admin@laelsi.com';
    superAdmin.phone = '123456789';

    // IMPORTANTE: Este es el usuario con el que te vas a loguear
    superAdmin.username = 'admin';
    superAdmin.role = UserRole.ADMIN;

    // IMPORTANTE: Usamos el método de la entidad para hashear la password
    await superAdmin.setPassword('admin123');

    // 3. Guardar en BD
    forkEm.persist(superAdmin);
    await forkEm.flush();

    console.log('✅ Admin creado exitosamente');
    console.log('👉 Username: admin');
    console.log('👉 Pass: admin123');

    // 4. Verificamos si ya existen categorías
    const categoryCount = await forkEm.count(Category, {});

    if (categoryCount === 0) {
      console.log('🌱 Base de datos sin Categorías. Creando Categorías por defecto...');

      // 5. Crear las Categorías por defecto
      const libreriaCategory = new Category();
      libreriaCategory.name = 'Libreria';
      libreriaCategory.description = 'Productos de Libreria';

      const jugueteriaCategory = new Category();
      jugueteriaCategory.name = 'Jugueteria';
      jugueteriaCategory.description = 'Productos de Jugueteria';

      const tecnologiaCategory = new Category();
      tecnologiaCategory.name = 'Tecnologia';
      tecnologiaCategory.description = 'Productos de Tecnologia';

      // 6. Guardar en BD
      forkEm.persist(libreriaCategory);
      forkEm.persist(jugueteriaCategory);
      forkEm.persist(tecnologiaCategory);
      await forkEm.flush();

      console.log('✅ Categorías creadas exitosamente');
      console.log('👉 Nombres: Libreria, Jugueteria, Tecnologia');

      // 7. Crear productos por defecto en Libreria
      console.log('🌱 Creando productos por defecto en Libreria...');

      // Producto 1: Lápiz
      const product1 = new Product();
      product1.name = 'Lápiz HB';
      product1.description = 'Lápiz de grafito HB para escritura y dibujo';
      product1.brand = 'Marca Genérica';
      product1.total_sold = 0;
      product1.stock = 100;
      product1.category = libreriaCategory;

      // Precio para producto 1
      const price1 = new Price();
      price1.amount = 50;
      price1.currency = Currency.ARS;
      price1.product = product1;
      product1.prices.add(price1);

      // Foto para producto 1
      const photo1 = new ProductPhoto();
      photo1.fileName = 'lapiz.jpg';
      photo1.originalName = 'lapiz.jpg';
      photo1.mimeType = 'image/jpeg';
      photo1.order = 0;
      photo1.product = product1;
      product1.photos.add(photo1);

      forkEm.persist(product1);
      await forkEm.flush();
      console.log('✅ Producto 1 creado: Lápiz HB');

      // Producto 2: Cuaderno
      const product2 = new Product();
      product2.name = 'Cuaderno rayado';
      product2.description = 'Cuaderno rayado de 100 hojas tamaño A4';
      product2.brand = 'Marca Genérica';
      product2.total_sold = 0;
      product2.stock = 50;
      product2.category = libreriaCategory;

      // Precio para producto 2
      const price2 = new Price();
      price2.amount = 200;
      price2.currency = Currency.ARS;
      price2.product = product2;
      product2.prices.add(price2);

      // Foto para producto 2
      const photo2 = new ProductPhoto();
      photo2.fileName = 'cuaderno.jpg';
      photo2.originalName = 'cuaderno.jpg';
      photo2.mimeType = 'image/jpeg';
      photo2.order = 0;
      photo2.product = product2;
      product2.photos.add(photo2);

      forkEm.persist(product2);
      await forkEm.flush();
      console.log('✅ Producto 2 creado: Cuaderno rayado');

      // Producto 3: Goma de borrar
      const product3 = new Product();
      product3.name = 'Goma de borrar';
      product3.description = 'Goma de borrar blanca para lápiz';
      product3.brand = 'Marca Genérica';
      product3.total_sold = 0;
      product3.stock = 80;
      product3.category = libreriaCategory;

      // Precio para producto 3
      const price3 = new Price();
      price3.amount = 30;
      price3.currency = Currency.ARS;
      price3.product = product3;
      product3.prices.add(price3);

      // Foto para producto 3
      const photo3 = new ProductPhoto();
      photo3.fileName = 'goma.jpg';
      photo3.originalName = 'goma.jpg';
      photo3.mimeType = 'image/jpeg';
      photo3.order = 0;
      photo3.product = product3;
      product3.photos.add(photo3);

      forkEm.persist(product3);
      await forkEm.flush();
      console.log('✅ Producto 3 creado: Goma de borrar');

      // Producto 4: Regla
      const product4 = new Product();
      product4.name = 'Regla de 30 cm';
      product4.description = 'Regla transparente de 30 centímetros';
      product4.brand = 'Marca Genérica';
      product4.total_sold = 0;
      product4.stock = 60;
      product4.category = libreriaCategory;

      // Precio para producto 4
      const price4 = new Price();
      price4.amount = 100;
      price4.currency = Currency.ARS;
      price4.product = product4;
      product4.prices.add(price4);

      // Foto para producto 4
      const photo4 = new ProductPhoto();
      photo4.fileName = 'regla.jpg';
      photo4.originalName = 'regla.jpg';
      photo4.mimeType = 'image/jpeg';
      photo4.order = 0;
      photo4.product = product4;
      product4.photos.add(photo4);

      forkEm.persist(product4);
      await forkEm.flush();
      console.log('✅ Producto 4 creado: Regla de 30 cm');
    }
  } catch (error) {
    console.error('❌ Error ejecutando seedDatabase:', error);
  }
}

