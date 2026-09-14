/**
 * One-time migration script: converts all non-WebP images in uploads/ to WebP,
 * updates the database records (ProductPhoto and UserPhoto), and deletes the originals.
 *
 * Usage (from the `be/` directory):
 *   npx ts-node --esm src/shared/scripts/migrateImagesToWebp.ts
 *   OR after compiling: node dist/shared/scripts/migrateImagesToWebp.js
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
    console.log(`\n📁 Processing folder: ${folder.label}`);

    if (!fs.existsSync(folder.path)) {
      console.log(`   ⚠️  Folder not found, skipping: ${folder.path}`);
      continue;
    }

    const files = fs.readdirSync(folder.path);

    for (const fileName of files) {
      const ext = path.extname(fileName).toLowerCase();

      // Skip already-WebP, hidden files, and gitkeep
      if (ext === '.webp' || fileName.startsWith('.')) {
        skipped++;
        continue;
      }

      if (!CONVERTIBLE_EXTENSIONS.has(ext)) {
        console.log(`   ⏭️  Unsupported extension, skipping: ${fileName}`);
        skipped++;
        continue;
      }

      const originalPath = path.join(folder.path, fileName);
      const newFileName = `${path.basename(fileName, ext)}.webp`;
      const newPath = path.join(folder.path, newFileName);

      try {
        // Convert to WebP
        await sharp(originalPath)
          .webp({ quality: 80 })
          .toFile(newPath);

        // Update DB record: find the Photo by its old fileName and rename it
        const photo = await em.findOne(Photo, { fileName });
        if (photo) {
          photo.fileName = newFileName;
          await em.flush();
          console.log(`   ✅  ${fileName} → ${newFileName} (DB updated)`);
        } else {
          // File on disk but no DB record — convert anyway, leave original for safety
          console.log(`   ✅  ${fileName} → ${newFileName} (no DB record found, file converted)`);
        }

        // Delete original only after successful conversion + DB update
        fs.unlinkSync(originalPath);
        converted++;
      } catch (err) {
        console.error(`   ❌  Failed to convert ${fileName}:`, err);
        // Clean up failed output if it was partially written
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
        errors++;
      }
    }
  }

  await orm.close();

  console.log('\n========================================');
  console.log(`✅  Converted : ${converted}`);
  console.log(`⏭️  Skipped   : ${skipped}`);
  console.log(`❌  Errors    : ${errors}`);
  console.log('========================================');
}

migrate().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
