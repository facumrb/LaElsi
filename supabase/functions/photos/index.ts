// ============================================================================
// Edge Function: photos (Tarea 3.5)
// ============================================================================
// Reemplaza a photo.routes.ts + productPhoto.service.ts + userPhoto.service.ts.
// Gestiona los METADATOS de las fotos. Los archivos ya no pasan por el backend:
// el navegador los sube directo a R2 con una URL prefirmada (ver get-upload-url)
// y después registra acá la key resultante.
//
//   Fotos de producto (solo Admin)
//     POST   /photos/productPhotos/:productId   body: { fileNames: string[], orders?: number[] }
//     POST   /photos/reorder                    body: { photosOrder: [{ id, order }] }
//     DELETE /photos/productPhotos/:photoId
//   Foto de perfil (el dueño de la cuenta o un Admin)
//     POST   /photos/userPhoto/:userId          body: { fileName: string }
//     DELETE /photos/userPhoto/:photoId
// ============================================================================
import { sql, type Db } from '../_shared/db.ts';
import { requireAdmin, requireOwnerOrAdmin } from '../_shared/auth.ts';
import { AppError, created, intParam, ok, serveRoutes, type RequestContext } from '../_shared/http.ts';
import { assertValidKey, deleteObject, getObjectSize, type PhotoScope } from '../_shared/r2.ts';

const MAX_PHOTOS = 10;
const MAX_PRODUCT_FILE_SIZE = 5 * 1024 * 1024; // 5MB por archivo
const MAX_USER_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Verifica que el archivo exista en R2 (la subida terminó bien) y que no supere
 * el tamaño máximo. Si lo supera, lo borra del bucket.
 */
async function assertUploaded(scope: PhotoScope, key: string, maxSize: number): Promise<void> {
  const size = await getObjectSize(scope, key);
  if (size === null) {
    throw new AppError('La imagen no se encontró en el almacenamiento. Volvé a subirla.', 400);
  }
  if (size > maxSize) {
    await deleteObject(scope, key);
    throw new AppError(`La imagen excede el límite de ${maxSize / (1024 * 1024)}MB`, 400);
  }
}

/**
 * Borra de R2 los archivos recién subidos que quedaron sin registrar (porque el registro falló).
 *
 * Nunca toca una key que ya figura en la tabla photo: si el registro falló justamente porque esa
 * key ya pertenece a otra foto (violación de unicidad), borrarla destruiría el archivo de otra
 * persona. Las keys son UUID, pero las URLs de las imágenes son públicas y las incluyen.
 */
async function discardUnregistered(scope: PhotoScope, fileNames: string[]): Promise<void> {
  let inUse: Set<string>;
  try {
    const registered = await sql`select file_name from photo where file_name in ${sql(fileNames)}`;
    inUse = new Set(registered.map((row) => row.fileName as string));
  } catch (err) {
    // Ante la duda se conserva el archivo: un huérfano cuesta centavos, uno ajeno borrado no se recupera
    console.error('No se pudo verificar qué archivos están registrados; no se borra ninguno de R2', err);
    return;
  }

  await Promise.all(
    fileNames.filter((fileName) => !inUse.has(fileName)).map((fileName) => deleteObject(scope, fileName)),
  );
}

// ─── Fotos de producto ───────────────────────────────────────────────────────

async function registerProductPhotos(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const productId = intParam(ctx, 'productId', 'ID de Producto inválido');

  const fileNames: unknown = ctx.body.fileNames;
  if (!Array.isArray(fileNames) || fileNames.length === 0) {
    throw new AppError('No se enviaron imágenes', 400);
  }
  for (const fileName of fileNames) assertValidKey(fileName);

  const ordersArray: number[] = Array.isArray(ctx.body.orders) ? ctx.body.orders.map(Number) : [];

  try {
    await Promise.all(fileNames.map((fileName) => assertUploaded('product', fileName, MAX_PRODUCT_FILE_SIZE)));

    const photos = await sql.begin(async (tx: Db) => {
      const [product] = await tx`select id from product where id = ${productId} for update`;
      if (!product) throw new AppError('El producto no existe', 404);

      const existing = await tx`select "order" from photo where product_id = ${productId}`;
      if (existing.length + fileNames.length > MAX_PHOTOS) {
        throw new AppError(`Limite de ${MAX_PHOTOS} fotos excedido.`, 400);
      }

      // Si viene un orden por cada archivo se respeta; si no, se agregan al final
      const useExplicitOrder = ordersArray.length === fileNames.length && ordersArray.every(Number.isInteger);
      // deno-lint-ignore no-explicit-any
      let nextFallbackOrder = (existing.length > 0 ? Math.max(...existing.map((p: any) => p.order)) : -1) + 1;

      const inserted = [];
      for (const [index, fileName] of fileNames.entries()) {
        const order = useExplicitOrder ? (ordersArray.at(index) as number) : nextFallbackOrder++;
        const [photo] = await tx`
          insert into photo ${tx({ type: 'product_photo', fileName, order, productId })}
          returning id, file_name, "order", product_id
        `;
        inserted.push(photo);
      }

      await tx`update product set updated_at = now() where id = ${productId}`;
      return inserted;
    });

    return created('Fotos subidas correctamente', photos);
  } catch (err) {
    // Si el registro falla, los archivos ya subidos quedarían huérfanos: se limpian
    await discardUnregistered('product', fileNames as string[]);
    throw err;
  }
}

async function reorderProductPhotos(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const photosOrder = ctx.body.photosOrder;

  if (!photosOrder || !Array.isArray(photosOrder)) {
    throw new AppError('Formato inválido', 400);
  }

  for (const item of photosOrder) {
    if (!item?.id || Number.isNaN(Number(item.id))) {
      throw new AppError('Cada elemento debe tener un "id" numérico válido', 400);
    }
    const order = Number(item.order);
    if (item.order === undefined || item.order === null || !Number.isInteger(order) || order < 0) {
      throw new AppError(`El "order" del elemento con id ${item.id} debe ser un entero mayor o igual a 0`, 400);
    }
  }

  await sql.begin(async (tx: Db) => {
    const productIds = new Set<number>();

    for (const item of photosOrder) {
      const [photo] = await tx`
        update photo set "order" = ${Number(item.order)}
        where id = ${Number(item.id)} and type = 'product_photo'
        returning product_id
      `;
      if (!photo) throw new AppError(`Foto con id ${item.id} no encontrada`, 404);
      productIds.add(photo.productId);
    }

    if (productIds.size > 0) {
      await tx`update product set updated_at = now() where id in ${tx([...productIds])}`;
    }
  });

  return ok('Orden actualizado');
}

async function deleteProductPhoto(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const id = intParam(ctx, 'photoId', 'ID de foto inválido');

  const [photo] = await sql`
    delete from photo where id = ${id} and type = 'product_photo'
    returning file_name, product_id
  `;
  if (!photo) throw new AppError('La foto no existe', 404);

  await sql`update product set updated_at = now() where id = ${photo.productId}`;
  await deleteObject('product', photo.fileName);

  return ok('Foto eliminada correctamente');
}

// ─── Foto de perfil ──────────────────────────────────────────────────────────

async function registerUserPhoto(ctx: RequestContext) {
  const userId = intParam(ctx, 'userId', 'ID de Usuario inválido');

  // Solo el dueño de la cuenta o un administrador pueden cambiar la foto
  await requireOwnerOrAdmin(ctx.req, userId).catch((err) => {
    if (err instanceof AppError && err.statusCode === 403) {
      throw new AppError('No tienes permisos para modificar esta foto', 403);
    }
    throw err;
  });

  const fileName = ctx.body.fileName;
  if (!fileName) throw new AppError('No se envió ninguna imagen', 400);
  assertValidKey(fileName);

  try {
    await assertUploaded('user', fileName, MAX_USER_FILE_SIZE);

    const { userPhoto, previousFileName } = await sql.begin(async (tx: Db) => {
      const [user] = await tx`select id from "user" where id = ${userId} for update`;
      if (!user) throw new AppError('El usuario no existe', 404);

      const [existing] = await tx`select id, file_name from photo where user_id = ${userId}`;
      let row;
      if (existing) {
        // Reemplazo: se reutiliza el registro de la foto anterior
        [row] = await tx`update photo set file_name = ${fileName} where id = ${existing.id} returning id, file_name`;
      } else {
        [row] = await tx`
          insert into photo ${tx({ type: 'user_photo', fileName, userId })}
          returning id, file_name
        `;
      }

      await tx`update "user" set updated_at = now() where id = ${userId}`;
      return { userPhoto: row, previousFileName: (existing?.fileName ?? null) as string | null };
    });

    // El archivo anterior se borra recién cuando el reemplazo quedó confirmado en la base.
    // Si se registró la misma key que ya tenía, es el archivo vigente: no se toca.
    if (previousFileName && previousFileName !== fileName) await deleteObject('user', previousFileName);

    return created('Foto de perfil actualizada correctamente', {
      fileName: userPhoto.fileName,
      id: userPhoto.id,
    });
  } catch (err) {
    // Si el registro falla, el archivo recién subido quedaría huérfano: se limpia
    await discardUnregistered('user', [fileName]);
    throw err;
  }
}

async function deleteUserPhoto(ctx: RequestContext) {
  const photoId = intParam(ctx, 'photoId', 'ID de foto inválido');

  const [photo] = await sql`select id, file_name, user_id from photo where id = ${photoId} and type = 'user_photo'`;
  if (!photo) throw new AppError('Foto no encontrada', 404);

  await requireOwnerOrAdmin(ctx.req, photo.userId).catch((err) => {
    if (err instanceof AppError && err.statusCode === 403) {
      throw new AppError('No tienes permisos para eliminar esta foto', 403);
    }
    throw err;
  });

  await sql`delete from photo where id = ${photoId}`;
  await sql`update "user" set updated_at = now() where id = ${photo.userId}`;
  await deleteObject('user', photo.fileName);

  return ok('Foto de perfil eliminada');
}

serveRoutes('photos', [
  // --- Rutas de Producto (Solo Admin) ---
  ['POST', '/productPhotos/:productId', registerProductPhotos],
  ['POST', '/reorder', reorderProductPhotos],
  ['DELETE', '/productPhotos/:photoId', deleteProductPhoto],

  // --- Rutas de Usuario (el dueño de la cuenta o un Admin) ---
  ['POST', '/userPhoto/:userId', registerUserPhoto],
  ['DELETE', '/userPhoto/:photoId', deleteUserPhoto],
]);
