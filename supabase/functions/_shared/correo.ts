// ============================================================================
// Envío de correos transaccionales con Resend (https://resend.com)
// ============================================================================
// Resend solo ENVÍA el correo. Todo lo sensible (generar y validar el token,
// cambiar la contraseña) lo resuelve nuestro backend.
//
// Se llama a la API REST con fetch en vez de usar el SDK oficial: enviar un
// correo es un único POST, y así no se suma una dependencia al runtime de Deno.
//
// Configuración (secrets de las Edge Functions, ver README):
//   RESEND_API_KEY   Clave de la API (empieza con "re_"). Nunca va en el frontend.
//   RESEND_FROM      Remitente, con el formato  Laelsi <no-reply@tu-dominio.com>.
//                    El dominio tiene que estar verificado en Resend.
// ============================================================================
import { AppError } from './http.ts';
import type { EmailContent } from './correo-plantillas.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';

function getConfig(): { apiKey: string; from: string } | null {
  const apiKey = (Deno.env.get('RESEND_API_KEY') ?? '').trim();
  const from = (Deno.env.get('RESEND_FROM') ?? '').trim();
  return apiKey && from ? { apiKey, from } : null;
}

/**
 * Corta la petición con un 500 si faltan los datos de Resend.
 *
 * Se llama ANTES de buscar a la persona en la base: así el error depende solo
 * de la configuración del servidor y no revela si una cuenta existe o no.
 */
export function assertEmailConfigured(): void {
  if (!getConfig()) {
    throw new AppError('El envío de correos no está configurado', 500);
  }
}

/**
 * Envía un correo. Lanza un error si Resend lo rechaza.
 *
 * @param idempotencyKey Clave única del envío. Si la misma petición se repite
 *   (por un reintento de red), Resend reconoce la clave y no manda el correo dos veces.
 */
export async function sendEmail(message: EmailContent & { to: string; idempotencyKey?: string }): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error('Faltan RESEND_API_KEY o RESEND_FROM');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };
  if (message.idempotencyKey) headers['Idempotency-Key'] = message.idempotencyKey;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: config.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    // El detalle queda en los logs de la función; nunca se le muestra a la persona
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend respondió ${response.status}: ${detail}`);
  }
}
