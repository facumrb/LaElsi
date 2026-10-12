// ============================================================================
// Edge Function: get-upload-url (Tarea 2.4)
// ============================================================================
// Genera una URL prefirmada de Cloudflare R2 para que el navegador suba una
// imagen directamente al bucket con un PUT. Reemplaza a Multer.
//
//   POST /get-upload-url
//   body: { scope: 'product' | 'user', targetId: number }
//   resp: { uploadUrl, key, headers, expiresIn }
//
// Permisos:
//   - scope 'product': solo Admin (targetId = ID del producto).
//   - scope 'user':    el dueño de la cuenta o un Admin (targetId = ID del usuario).
//
// La URL vence a los 5 minutos y solo acepta archivos image/webp. La foto recién
// queda asociada cuando el frontend la registra en la función "photos".
// ============================================================================
import { sql } from '../_shared/db.ts';
import { requireAdmin, requireOwnerOrAdmin } from '../_shared/auth.ts';
import { AppError, ok, serveRoutes, type RequestContext } from '../_shared/http.ts';
import { createUploadUrl, newObjectKey, UPLOAD_HEADERS, UPLOAD_URL_TTL, type PhotoScope } from '../_shared/r2.ts';

const MAX_PRODUCT_PHOTOS = 10;

async function getUploadUrl(ctx: RequestContext) {
  const scope = ctx.body.scope as PhotoScope;
  const targetId = Number(ctx.body.targetId);

  if (scope !== 'product' && scope !== 'user') {
    throw new AppError('El campo "scope" debe ser "product" o "user"', 400);
  }
  if (!Number.isInteger(targetId) || targetId <= 0) {
    throw new AppError('El campo "targetId" debe ser un ID válido', 400);
  }

  if (scope === 'product') {
    await requireAdmin(ctx.req);

    const [product] = await sql`select id from product where id = ${targetId}`;
    if (!product) throw new AppError('El producto no existe', 404);

    const [{ total }] = await sql`select count(*)::int as total from photo where product_id = ${targetId}`;
    if (total >= MAX_PRODUCT_PHOTOS) {
      throw new AppError(`Limite de ${MAX_PRODUCT_PHOTOS} fotos excedido.`, 400);
    }
  } else {
    await requireOwnerOrAdmin(ctx.req, targetId);

    const [user] = await sql`select id from "user" where id = ${targetId}`;
    if (!user) throw new AppError('El usuario no existe', 404);
  }

  // La key la define el servidor: el cliente no puede elegir ni pisar archivos ajenos
  const key = newObjectKey();
  const uploadUrl = await createUploadUrl(scope, key);

  return ok('URL de subida generada', {
    uploadUrl,
    key,
    // Headers que el navegador debe enviar tal cual en el PUT (están firmados)
    headers: UPLOAD_HEADERS,
    expiresIn: UPLOAD_URL_TTL,
  });
}

serveRoutes('get-upload-url', [['POST', '/', getUploadUrl]]);
