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
import { orderRouter } from './order/order.routes.js';
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
app.use('/api/orders', orderRouter);

// Rutas de Fotos de Productos
// Ejemplo URL: http://localhost:3000/uploads/products/foto.jpg
app.use('/uploads/products', express.static(path.join(process.cwd(), 'uploads/products')));

// Rutas de Fotos de Usuarios/Perfil
// Ejemplo URL: http://localhost:3000/uploads/users/avatar.jpg
app.use('/uploads/users', express.static(path.join(process.cwd(), 'uploads/users')));

import { errorHandler } from './shared/errors/errorHandler.js';
import { AppError } from './shared/errors/appError.js';

// ... (other imports)

// (Rest of app setup)

// Handle 404 before global error handler
app.use((req, res, next) => {
  next(new AppError(`No se encontró la ruta ${req.originalUrl} en este servidor`, 404));
});

// Global Error Handler
app.use(errorHandler as any);

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
