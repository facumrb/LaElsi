import 'reflect-metadata';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { RequestContext } from '@mikro-orm/core';
import { adminRouter } from './user/admin/admin.routes.js';
import { clientRouter } from './user/client/client.routes.js';
import { categoryRouter } from './category/category.routes.js';
import { productRouter } from './product/product.routes.js';
import { photoRouter } from './photo/photo.routes.js';
import { userRouter } from './user/user.routes.js';
import { orm, syncSchema } from './shared/db/orm.js';
import { seedDatabase } from './shared/db/seed.js';

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

//luego de los middlewares base
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
//antes de las rutas y middlewares de negocio

// --- RUTAS DE API ---
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/admins', adminRouter);
app.use('/api/clients', clientRouter);
app.use('/api/photos', photoRouter);
app.use('/api/users', userRouter);

// Rutas de Fotos de Productos
// Ejemplo URL: http://localhost:3000/uploads/products/foto.jpg
app.use('/uploads/products', express.static(path.join(process.cwd(), 'uploads/products')));

// Rutas de Fotos de Usuarios/Perfil
// Ejemplo URL: http://localhost:3000/uploads/users/avatar.jpg
app.use('/uploads/users', express.static(path.join(process.cwd(), 'uploads/users')));

app.use((_, res) => {
  return res.status(404).send({ message: 'Recurso no encontrado' });
});

async function startServer() {
  try {
    // Sincronizamos base de datos antes de abrir el puerto
    await syncSchema();
    console.log('Base de datos sincronizada');
    await seedDatabase();
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000/');
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1); // Cierra el proceso si no hay DB
  }
}

startServer();
