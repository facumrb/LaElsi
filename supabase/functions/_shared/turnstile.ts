// ============================================================================
// Cloudflare Turnstile: verificación anti-bots del lado del servidor (Tarea 4.5)
// ============================================================================
// El frontend muestra el widget, obtiene un token y lo envía en el header
// X-Turnstile-Token. Acá se valida ese token contra la API de Cloudflare.
// Un token solo sirve una vez y vence a los 5 minutos.
// ============================================================================
import { AppError } from './http.ts';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Una IP v4 o v6 en texto: solo dígitos hexadecimales, puntos y dos puntos (45 caracteres como máximo). */
const IP_PATTERN = /^[0-9a-fA-F:.]{3,45}$/;

/**
 * IP real del cliente. Con ella se limitan los intentos de login y las solicitudes de recuperación.
 *
 * SEGURIDAD: el navegador controla el header X-Forwarded-For, así que su PRIMER valor no es
 * confiable: cada proxy agrega la IP que ve al FINAL de la lista. Un reporte de la comunidad de
 * Supabase (sobre la API de datos; para las Edge Functions no hay nada documentado) muestra que
 * `X-Forwarded-For: falsa` llega como `falsa, <ip real>`. Por eso se usa, en este orden:
 *   1. CF-Connecting-IP, que escribe Cloudflare y descarta el valor que mande el cliente.
 *   2. El ÚLTIMO valor de X-Forwarded-For, el que agregó el proxy de confianza.
 *
 * Todo valor que no parezca una IP se descarta ('desconocida'): además de no ser confiable,
 * se guarda en una columna VARCHAR(64) y uno enorme haría fallar el INSERT del intento,
 * con lo cual el intento ni siquiera quedaría registrado.
 */
export function getClientIp(req: Request): string {
  const candidates = [
    req.headers.get('CF-Connecting-IP') ?? '',
    (req.headers.get('X-Forwarded-For') ?? '').split(',').at(-1) ?? '',
  ];

  for (const candidate of candidates) {
    const ip = candidate.trim();
    if (IP_PATTERN.test(ip)) return ip;
  }
  return 'desconocida';
}

/**
 * Indica si la función corre en el stack local de Supabase (`supabase start`), que se sirve por
 * http://. En producción SUPABASE_URL es siempre https://.
 */
function isLocalStack(): boolean {
  return (Deno.env.get('SUPABASE_URL') ?? '').startsWith('http://');
}

/**
 * Exige un token de Turnstile válido.
 *
 * Si falta TURNSTILE_SECRET_KEY la verificación solo se omite en el stack LOCAL, para poder probar
 * el flujo sin el widget. En producción FALLA CERRADO: un secret olvidado o borrado no puede dejar
 * el checkout, el registro y la recuperación de contraseña sin protección anti-bots sin que nadie
 * lo note.
 */
export async function requireTurnstile(req: Request): Promise<void> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) {
    if (isLocalStack()) return;
    console.error('Falta TURNSTILE_SECRET_KEY: se rechaza la petición (la verificación anti-bots no puede omitirse en producción)');
    throw new AppError('La verificación de seguridad no está configurada. Intentá de nuevo más tarde.', 500);
  }

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
