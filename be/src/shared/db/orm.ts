import { MikroORM } from '@mikro-orm/core';
// import { EntityManager } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import 'dotenv/config';
import { Administrador } from '../../usuario/administrador/administrador.entity.js';
import { Cliente } from '../../usuario/cliente/cliente.entity.js';
import { Categoria } from '../../producto/categoria.entity.js';
import { Item } from '../../producto/item.entity.js';
import { BaseEntity } from './baseEntity.entity.js';

// Validación básica para no intentar conectar si faltan datos
if (!process.env.DB_USER || !process.env.DB_NAME) {
  throw new Error('Faltan variables de entorno de base de datos (DB_USER o DB_NAME)');
}

export const orm = await MikroORM.init({
  entities: [Administrador, Cliente, Categoria, Item, BaseEntity],
  entitiesTs: [Administrador, Cliente, Categoria, Item, BaseEntity],
  dbName: process.env.DB_NAME,
  clientUrl: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  highlighter: new SqlHighlighter(),
  debug: true,
  driver: MySqlDriver,
  schemaGenerator: {
    //never in production
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: []
  }
});

export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator();
  /*   
  await generator.dropSchema()
  await generator.createSchema()
  */
  await generator.updateSchema();
};
