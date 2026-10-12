// ============================================================================
// Cloudflare Turnstile: verificación anti-bots del lado del servidor (Tarea 4.5)
// ============================================================================
// El frontend muestra el widget, obtiene un token y lo envía en el header
// X-Turnstile-Token. Acá se valida ese token contra la API de Cloudflare.
// Un token solo sirve una vez y vence a los 5 minutos.
// ============================================================================
import { AppError } from './http.ts';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** IP real del cliente (Supabase la informa en X-Forwarded-For). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('X-Forwarded-For') ?? '';
  return forwarded.split(',').at(0)?.trim() || 'desconocida';
}

/**
 * Exige un token de Turnstile válido.
 *
 * Si TURNSTILE_SECRET_KEY no está configurada (desarrollo local) la verificación
 * se omite, para poder probar el flujo sin el widget.
 */
export async function requireTurnstile(req: Request): Promise<void> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return;

  const token = req.headers.get('X-Turnstile-Token');
  if (!token) {
    throw new AppError('Falta la verificación de seguridad. Recargá la página e intentá de nuevo.', 403);
  }

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  form.append('remoteip', getClientIp(req));

  let success = false;
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body: form });
    const result = await response.json();
    success = result?.success === true;
  } catch (err) {
    console.error('No se pudo contactar a Turnstile', err);
  }

  if (!success) {
    throw new AppError('No pudimos verificar que seas una persona. Recargá la página e intentá de nuevo.', 403);
  }
}
