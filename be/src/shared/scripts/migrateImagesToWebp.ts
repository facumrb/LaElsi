/**
 * Script de migración de única ejecución: convierte a WebP todas las imágenes de uploads/
 * que no lo sean, actualiza los registros de la base de datos (ProductPhoto y UserPhoto)
 * y elimina los archivos originales.
 *
 * Uso (desde el directorio `be/`):
 *   npx ts-node --esm src/shared/scripts/migrateImagesToWebp.ts
 *   O después de compilar: node dist/shared/scripts/migrateImagesToWebp.js
 */

import 'dotenv/config';
import 'reflect-metadata';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Photo } from '../../photo/photo.entity.js';
import { PRODUCTS_PATH, USERS_PATH } from '../config/paths.config.js';

const FOLDERS: { path: string; label: string }[] = [
  { path: PRODUCTS_PATH, label: 'products' },
  { path: USERS_PATH, label: 'users' },
];

const CONVERTIBLE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.avif']);

async function migrate() {
  if (!process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error('Faltan variables de entorno de base de datos (DB_USER o DB_NAME)');
  }

  const orm = await MikroORM.init({
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    dbName: process.env.DB_NAME,
    clientUrl: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    driver: MySqlDriver,
    debug: false,
  });

  const em = orm.em.fork();

  let converted = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of FOLDERS) {
    console.log(`\n📁 Procesando carpeta: ${folder.label}`);

    if (!fs.existsSync(folder.path)) {
      console.log(`   ⚠️  Carpeta no encontrada, se omite: ${folder.path}`);
      continue;
    }

    const files = fs.readdirSync(folder.path);

    for (const fileName of files) {
      const ext = path.extname(fileName).toLowerCase();

      // Omitir los que ya son WebP, los archivos ocultos y el .gitkeep
      if (ext === '.webp' || fileName.startsWith('.')) {
        skipped++;
        continue;
      }

      if (!CONVERTIBLE_EXTENSIONS.has(ext)) {
        console.log(`   ⏭️  Extensión no soportada, se omite: ${fileName}`);
        skipped++;
        continue;
      }

      const originalPath = path.join(folder.path, fileName);
      const newFileName = `${path.basename(fileName, ext)}.webp`;
      const newPath = path.join(folder.path, newFileName);

      try {
        // Convertir a WebP
        await sharp(originalPath)
          .webp({ quality: 80 })
          .toFile(newPath);

        // Actualizar el registro en la DB: buscar la Photo por su fileName anterior y renombrarla
        const photo = await em.findOne(Photo, { fileName });
        if (photo) {
          photo.fileName = newFileName;
          await em.flush();
          console.log(`   ✅  ${fileName} → ${newFileName} (DB actualizada)`);
        } else {
          // El archivo está en disco pero no tiene registro en la DB: se convierte igual
          console.log(`   ✅  ${fileName} → ${newFileName} (sin registro en la DB, archivo convertido)`);
        }

        // Eliminar el original recién después de convertir y actualizar la DB con éxito
        fs.unlinkSync(originalPath);
        converted++;
      } catch (err) {
        console.error(`   ❌  Error al convertir ${fileName}:`, err);
        // Limpiar el archivo de salida si quedó escrito a medias
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
        errors++;
      }
    }
  }

  await orm.close();

  console.log('\n========================================');
  console.log(`✅  Convertidas : ${converted}`);
  console.log(`⏭️  Omitidas    : ${skipped}`);
  console.log(`❌  Errores     : ${errors}`);
  console.log('========================================');
}

migrate().catch((err) => {
  console.error('Error fatal durante la migración:', err);
  process.exit(1);
});
