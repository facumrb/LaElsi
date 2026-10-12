// ============================================================================
// Cloudflare R2 (reemplaza a Multer + FileStorageUtil)
// ============================================================================
// R2 es compatible con la API de S3. Se usa aws4fetch, una librería mínima que
// firma peticiones con SigV4 usando fetch (funciona nativamente en Deno).
//
// Flujo de subida: el navegador pide una URL prefirmada, sube el archivo
// DIRECTO a R2 con un PUT y después registra la foto en la base. El binario
// nunca pasa por las Edge Functions.
// ============================================================================
import { AwsClient } from 'npm:aws4fetch@1.0.20';
import { AppError } from './http.ts';

export type PhotoScope = 'product' | 'user';

const ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') ?? '';
const ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
const SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';

const BUCKETS = new Map<PhotoScope, string>([
  ['product', Deno.env.get('R2_BUCKET_PRODUCTS') ?? 'laelsi-products'],
  ['user', Deno.env.get('R2_BUCKET_USERS') ?? 'laelsi-users'],
]);

/** Todas las imágenes se suben ya convertidas a WebP desde el navegador. */
export const UPLOAD_CONTENT_TYPE = 'image/webp';
/** Validez de la URL prefirmada, en segundos. */
export const UPLOAD_URL_TTL = 300;

/**
 * Headers que el navegador DEBE enviar en el PUT (forman parte de la firma).
 * Cache-Control: cada archivo tiene un nombre único (UUID) y nunca se modifica,
 * así que el navegador y la CDN pueden guardarlo por un año sin volver a pedirlo.
 * Es lo que evita descargar dos veces la misma imagen.
 */
export const UPLOAD_HEADERS: Record<string, string> = {
  'Content-Type': UPLOAD_CONTENT_TYPE,
  'Cache-Control': 'public, max-age=31536000, immutable',
};

/** Las keys las genera el servidor: un UUID con extensión .webp. */
const KEY_PATTERN = /^[0-9a-f-]{36}\.webp$/;

let client: AwsClient | null = null;

function getClient(): AwsClient {
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new AppError('El almacenamiento de imágenes no está configurado', 500);
  }
  client ??= new AwsClient({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });
  return client;
}

function objectUrl(scope: PhotoScope, key: string): URL {
  const bucket = BUCKETS.get(scope);
  return new URL(`https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key)}`);
}

/** Genera una key nueva e impredecible para un archivo. */
export function newObjectKey(): string {
  return `${crypto.randomUUID()}.webp`;
}

/** Valida que una key tenga el formato que genera el servidor. */
export function assertValidKey(key: unknown): asserts key is string {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) {
    throw new AppError('Nombre de archivo inválido', 400);
  }
}

/**
 * Genera una URL prefirmada para subir un archivo con un PUT.
 * Los headers de UPLOAD_HEADERS forman parte de la firma: R2 rechaza la subida
 * si el navegador intenta enviar algo que no sea image/webp.
 */
export async function createUploadUrl(scope: PhotoScope, key: string): Promise<string> {
  const url = objectUrl(scope, key);
  url.searchParams.set('X-Amz-Expires', String(UPLOAD_URL_TTL));

  const signed = await getClient().sign(new Request(url, { method: 'PUT', headers: UPLOAD_HEADERS }), {
    aws: { signQuery: true, allHeaders: true },
  });

  return signed.url;
}

/**
 * Devuelve el tamaño en bytes del objeto, o null si no existe en el bucket.
 * Se usa antes de registrar una foto: confirma que la subida se completó y
 * permite rechazar archivos que superen el tamaño máximo.
 */
export async function getObjectSize(scope: PhotoScope, key: string): Promise<number | null> {
  const response = await getClient().fetch(objectUrl(scope, key), { method: 'HEAD' });
  if (!response.ok) return null;
  return Number(response.headers.get('Content-Length') ?? 0);
}

/**
 * Elimina un objeto del bucket. Nunca lanza error: si el archivo no existe o
 * R2 falla, se registra el problema y la operación de negocio continúa
 * (igual que hacía FileStorageUtil.safeDeleteFile).
 */
export async function deleteObject(scope: PhotoScope, key: string): Promise<void> {
  try {
    const response = await getClient().fetch(objectUrl(scope, key), { method: 'DELETE' });
    if (!response.ok && response.status !== 404) {
      console.error(`No se pudo eliminar ${key} de R2 (HTTP ${response.status})`);
    }
  } catch (err) {
    console.error(`No se pudo eliminar ${key} de R2`, err);
  }
}
