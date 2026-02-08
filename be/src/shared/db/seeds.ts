import { Admin } from '../../user/admin/admin.entity.js';
import { UserRole } from '../../user/user.entity.js';
import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';
import { Price } from '../../product/price/price.entity.js';
import { ProductPhoto } from '../../photo/productPhoto/productPhoto.entity.js';
import { Currency } from '../enums/currency.enum.js';
import { orm } from './orm.js';

export async function seedDatabase() {
  try {
    const em = orm.em.fork();

    // 1. Verificamos si ya existen admins
    const adminCount = await em.count(Admin, {});
    if (adminCount > 0) {
      // Si ya hay admins, no hacemos nada para no duplicar ni reiniciar passwords
      return;
    }
    console.log('🌱 Base de datos sin Admins. Creando Super Admin...');

    // 2. Crear el Admin por defecto
    const superAdmin = new Admin();
    superAdmin.name = 'Super';
    superAdmin.last_name = 'Admin';
    superAdmin.dni = '11111111';
    superAdmin.email = 'admin@laelsi.com';
    superAdmin.phone = '123456789';

    // IMPORTANTE: Este es el usuario con el que te vas a loguear
    superAdmin.username = 'admin';
    superAdmin.role = UserRole.ADMIN;

    // IMPORTANTE: Usamos el método de la entidad para hashear la password
    await superAdmin.setPassword('admin123');

    // 3. Guardar en BD
    em.persist(superAdmin);
    await em.flush();

    console.log('✅ Admin creado exitosamente');
    console.log('👉 Username: admin');
    console.log('👉 Pass: admin123');

    // 4. Verificamos si ya existen categorías
    const categoryCount = await em.count(Category, {});

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
      em.persist(libreriaCategory);
      em.persist(jugueteriaCategory);
      em.persist(tecnologiaCategory);
      await em.flush();

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

      const photo2 = new ProductPhoto();
      photo2.fileName = 'lapiz2.jpg';
      photo2.originalName = 'lapiz2.jpg';
      photo2.mimeType = 'image/jpeg';
      photo2.order = 1;
      photo2.product = product1;
      product1.photos.add(photo2);

      em.persist(product1);
      await em.flush();
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
      const photo3 = new ProductPhoto();
      photo3.fileName = 'cuaderno.jpg';
      photo3.originalName = 'cuaderno.jpg';
      photo3.mimeType = 'image/jpeg';
      photo3.order = 0;
      photo3.product = product2;
      product2.photos.add(photo3);
      const photo4 = new ProductPhoto();
      photo4.fileName = 'cuaderno-a4.jpg';
      photo4.originalName = 'cuaderno-a4.jpg';
      photo4.mimeType = 'image/jpeg';
      photo4.order = 1;
      photo4.product = product2;
      product2.photos.add(photo4);

      em.persist(product2);
      await em.flush();
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
      const photo5 = new ProductPhoto();
      photo5.fileName = 'goma-de-borrar.png';
      photo5.originalName = 'goma-de-borrar.png';
      photo5.mimeType = 'image/png';
      photo5.order = 0;
      photo5.product = product3;
      product3.photos.add(photo5);

      em.persist(product3);
      await em.flush();
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
      const photo6 = new ProductPhoto();
      photo6.fileName = 'regla.webp';
      photo6.originalName = 'regla.webp';
      photo6.mimeType = 'image/webp';
      photo6.order = 0;
      photo6.product = product4;
      product4.photos.add(photo6);
      const photo7 = new ProductPhoto();
      photo7.fileName = 'regla0.webp';
      photo7.originalName = 'regla0.webp';
      photo7.mimeType = 'image/webp';
      photo7.order = 1;
      photo7.product = product4;
      product4.photos.add(photo7);
      const photo8 = new ProductPhoto();
      photo8.fileName = 'regla1.webp';
      photo8.originalName = 'regla1.webp';
      photo8.mimeType = 'image/webp';
      photo8.order = 2;
      photo8.product = product4;
      product4.photos.add(photo8);
      const photo9 = new ProductPhoto();
      photo9.fileName = 'regla2.png';
      photo9.originalName = 'regla2.png';
      photo9.mimeType = 'image/png';
      photo9.order = 3;
      photo9.product = product4;
      product4.photos.add(photo9);
      const photo10 = new ProductPhoto();
      photo10.fileName = 'regla3.webp';
      photo10.originalName = 'regla3.webp';
      photo10.mimeType = 'image/webp';
      photo10.order = 4;
      photo10.product = product4;
      product4.photos.add(photo10);
      const photo11 = new ProductPhoto();
      photo11.fileName = 'regla4.webp';
      photo11.originalName = 'regla4.webp';
      photo11.mimeType = 'image/webp';
      photo11.order = 5;
      photo11.product = product4;
      product4.photos.add(photo11);
      const photo12 = new ProductPhoto();
      photo12.fileName = 'regla5.jpg';
      photo12.originalName = 'regla5.jpg';
      photo12.mimeType = 'image/jpg';
      photo12.order = 6;
      photo12.product = product4;
      product4.photos.add(photo12);
      const photo13 = new ProductPhoto();
      photo13.fileName = 'regla6.png';
      photo13.originalName = 'regla6.png';
      photo13.mimeType = 'image/png';
      photo13.order = 7;
      photo13.product = product4;
      product4.photos.add(photo13);
      const photo14 = new ProductPhoto();
      photo14.fileName = 'regla7.png';
      photo14.originalName = 'regla7.png';
      photo14.mimeType = 'image/png';
      photo14.order = 8;
      photo14.product = product4;
      product4.photos.add(photo13);
      const photo15 = new ProductPhoto();
      photo15.fileName = 'regla8.png';
      photo15.originalName = 'regla8.png';
      photo15.mimeType = 'image/png';
      photo15.order = 9;
      photo15.product = product4;
      product4.photos.add(photo15);

      em.persist(product4);
      await em.flush();
      console.log('✅ Producto 4 creado: Regla de 30 cm');

      // Producto 5: Goma de borrar
      const product5 = new Product();
      product5.name = 'Remeras';
      product5.description = 'Remeras de algodón';
      product5.brand = 'Marca todoBolla';
      product5.total_sold = 0;
      product5.stock = 0;
      product5.category = libreriaCategory;

      // Precio para producto 5
      const price5 = new Price();
      price5.amount = 1935081;
      price5.currency = Currency.ARS;
      price5.product = product5;
      product5.prices.add(price5);

      // Foto para producto 5
      const photo16 = new ProductPhoto();
      photo16.fileName = 'remeras1.jpeg';
      photo16.originalName = 'remeras1.jpeg';
      photo16.mimeType = 'image/jpeg';
      photo16.order = 0;
      photo16.product = product5;
      product5.photos.add(photo16);
      const photo17 = new ProductPhoto();
      photo17.fileName = 'remeras2.jpeg';
      photo17.originalName = 'remeras2.jpeg';
      photo17.mimeType = 'image/jpeg';
      photo17.order = 1;
      photo17.product = product5;
      product5.photos.add(photo17);
      const photo18 = new ProductPhoto();
      photo18.fileName = 'remeras3.jpeg';
      photo18.originalName = 'remeras3.jpeg';
      photo18.mimeType = 'image/jpeg';
      photo18.order = 2;
      photo18.product = product5;
      product5.photos.add(photo18);
      const photo19 = new ProductPhoto();
      photo19.fileName = 'remeras4.jpeg';
      photo19.originalName = 'remeras4.jpeg';
      photo19.mimeType = 'image/jpeg';
      photo19.order = 3;
      photo19.product = product5;
      product5.photos.add(photo19);

      em.persist(product5);
      await em.flush();
      console.log('✅ Producto 5 creado: Remeras');
    }
  } catch (error) {
    console.error('❌ Error ejecutando seedDatabase:', error);
  }
}
