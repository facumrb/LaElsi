// ============================================================================
// LaElsi — Tarea 2.1: Migrar las imágenes de be/uploads/ a Cloudflare R2
// ============================================================================
// Sube todos los archivos .webp de be/uploads/products y be/uploads/users a sus
// buckets de R2, conservando el nombre de archivo (es el que está guardado en
// la tabla photo).
//
// Requisitos:
//   1. Los buckets ya creados en Cloudflare (Tarea 0.2).
//   2. Haber iniciado sesión en Wrangler:  npx wrangler login
//
// Uso (desde la raíz del repo):
//   node supabase/seed/subir-imagenes-r2.mjs
//   node supabase/seed/subir-imagenes-r2.mjs --dry-run    # solo muestra qué subiría
//
// Variables opcionales: R2_BUCKET_PRODUCTS (default laelsi-products) y
// R2_BUCKET_USERS (default laelsi-users).
// ============================================================================
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dryRun = process.argv.includes('--dry-run');
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

const FOLDERS = [
  { dir: join(repoRoot, 'be/uploads/products'), bucket: process.env.R2_BUCKET_PRODUCTS || 'laelsi-products' },
  { dir: join(repoRoot, 'be/uploads/users'), bucket: process.env.R2_BUCKET_USERS || 'laelsi-users' },
];

// Mismo Cache-Control que usan las subidas desde la aplicación: los archivos no
// cambian nunca, así que el navegador puede guardarlos por un año.
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

// En Windows se usa shell: true (ver más abajo) y Node concatena los argumentos sin
// comillas: una ruta con espacios (ej. "Desarrollo LaElsi") o el Cache-Control se
// partirían en varios argumentos. Se entrecomillan los que tengan espacios.
const useShell = process.platform === 'win32';
const arg = (value) => (useShell && /\s/.test(value) ? `"${value}"` : value);

let uploaded = 0;
let failed = 0;

for (const { dir, bucket } of FOLDERS) {
  console.log(`\n📁 ${dir} → ${bucket}`);

  if (!existsSync(dir)) {
    console.log('   ⚠️  Carpeta no encontrada, se omite');
    continue;
  }

  const files = readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.webp'));

  for (const fileName of files) {
    if (dryRun) {
      console.log(`   • ${fileName}`);
      continue;
    }

    try {
      execFileSync(
        'npx',
        [
          'wrangler',
          'r2',
          'object',
          'put',
          `${bucket}/${fileName}`,
          '--file',
          arg(join(dir, fileName)),
          '--content-type',
          'image/webp',
          '--cache-control',
          arg(CACHE_CONTROL),
          // Sin --remote, Wrangler escribe en un bucket simulado local
          '--remote',
        ],
        // shell: true es necesario en Windows para poder ejecutar npx
        { stdio: 'pipe', shell: useShell },
      );
      console.log(`   ✅ ${fileName}`);
      uploaded++;
    } catch (err) {
      console.error(`   ❌ ${fileName}: ${err.stderr?.toString().trim() || err.message}`);
      failed++;
    }
  }
}

if (!dryRun) {
  console.log('\n========================================');
  console.log(`✅ Subidas : ${uploaded}`);
  console.log(`❌ Errores : ${failed}`);
  console.log('========================================');
  process.exit(failed > 0 ? 1 : 0);
}
