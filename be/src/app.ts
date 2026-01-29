import 'reflect-metadata';
import express from 'express';
import { adminRouter } from './user/admin/admin.routes.js';
import { clientRouter } from './user/client/client.routes.js';
import { categoryRouter } from './category/category.routes.js';
import { itemRouter } from './item/item.routes.js';
// import { uploadDir } from './producto/item.controler.js';
import { orm, syncSchema } from './shared/db/orm.js';
import { RequestContext } from '@mikro-orm/core';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

//luego de los middlewares base
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
//antes de las rutas y middlewares de negocio

app.use('/api/categories', categoryRouter);
app.use('/api/items', itemRouter);
app.use('/api/admins', adminRouter);
app.use('/api/clients', clientRouter);
// Ruta para ver imágenes
/* app.use('/api/items/imagenesProductos', express.static(uploadDir));
 */

app.use((_, res) => {
  return res.status(404).send({ message: 'Recurso no encontrado' });
});

async function startServer() {
  try {
    // Sincronizamos base de datos antes de abrir el puerto
    await syncSchema();
    console.log('Base de datos sincronizada');

    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000/');
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1); // Cierra el proceso si no hay DB
  }
}

startServer();
