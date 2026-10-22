// ============================================================================
// Límite de solicitudes por IP para rutas públicas
// ============================================================================
// Usa la tabla rate_limit_event (la misma de check_field_unique). Esa función borra de vez en
// cuando TODOS los eventos de más de una hora, así que ninguna ventana puede ser mayor a 60 minutos.
// ============================================================================
import { sql } from './db.ts';
import { AppError } from './http.ts';

const MAX_WINDOW_MINUTES = 60;

/**
 * Registra una solicitud de `ip` en `bucket` y corta con 429 si ya hizo `max` dentro de la ventana.
 */
export async function enforceIpRateLimit(options: {
  bucket: string;
  ip: string;
  max: number;
  windowMinutes: number;
  message: string;
}): Promise<void> {
  const { bucket, ip, max, windowMinutes, message } = options;
  if (windowMinutes > MAX_WINDOW_MINUTES) {
    throw new Error(`La ventana del límite no puede superar ${MAX_WINDOW_MINUTES} minutos`);
  }

  const [{ total }] = await sql`
    select count(*)::int as total from rate_limit_event
    where bucket = ${bucket} and ip = ${ip} and created_at > now() - make_interval(mins => ${windowMinutes})
  `;
  if (total >= max) throw new AppError(message, 429);

  await sql`insert into rate_limit_event (bucket, ip) values (${bucket}, ${ip})`;

  // Limpieza ocasional (1 de cada 50), para no necesitar un proceso aparte
  if (Math.random() < 0.02) {
    await sql`delete from rate_limit_event where created_at < now() - interval '1 hour'`;
  }
}
