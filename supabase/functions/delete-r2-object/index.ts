// ============================================================================
// Edge Function: delete-r2-object (Tarea 2.5)
// ============================================================================
// Elimina un archivo de Cloudflare R2. Solo Admin.
//
//   POST /delete-r2-object
//   body: { scope: 'product' | 'user', key: string }
//
// Sirve para limpiar archivos huérfanos: imágenes que se subieron a R2 pero que
// nunca llegaron a registrarse (por ejemplo, si se canceló el formulario).
//
// Las fotos que SÍ están registradas no se borran por acá: hay que usar la
// función "photos", que elimina el registro y el archivo juntos. Por eso esta
// función rechaza las keys que todavía están referenciadas en la base.
// ============================================================================
import { sql } from '../_shared/db.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { AppError, ok, serveRoutes, type RequestContext } from '../_shared/http.ts';
import { assertValidKey, deleteObject, type PhotoScope } from '../_shared/r2.ts';

async function deleteR2Object(ctx: RequestContext) {
  await requireAdmin(ctx.req);

  const scope = ctx.body.scope as PhotoScope;
  const key = ctx.body.key;

  if (scope !== 'product' && scope !== 'user') {
    throw new AppError('El campo "scope" debe ser "product" o "user"', 400);
  }
  assertValidKey(key);

  const [photo] = await sql`select id from photo where file_name = ${key}`;
  if (photo) {
    throw new AppError('El archivo pertenece a una foto registrada. Eliminá la foto en lugar del archivo.', 409);
  }

  await deleteObject(scope, key);
  return ok('Archivo eliminado');
}

serveRoutes('delete-r2-object', [['POST', '/', deleteR2Object]]);
