// ============================================================================
// Edge Function: revocations
// ============================================================================
// Botón de arrepentimiento: Disposición 954/2025 de la Subsecretaría de Defensa
// del Consumidor y Lealtad Comercial (derogó la Resolución 424/2020), art. 34 de
// la Ley 24.240 y art. 1110 del Código Civil y Comercial.
//
//   POST /revocations     Registra una solicitud de arrepentimiento (pública)
//
// La norma pide que la persona pueda arrepentirse SIN registrarse ni hacer otro
// trámite, y que dentro de las 24 horas se le informe un código de identificación
// POR EL MISMO MEDIO. Por eso:
//   - La ruta es pública (sin sesión), pero se protege con Turnstile y con un tope
//     de solicitudes por IP, porque cada una dispara correos.
//   - El código viaja en la misma respuesta (el sitio lo muestra al instante) y
//     además se envía por email.
//   - El comercio recibe un aviso con todos los datos en REVOCATION_NOTIFY_EMAIL.
//     Si esa variable falta, la solicitud igual queda guardada en la base.
// ============================================================================
import { sql } from '../_shared/db.ts';
import { AppError, created, pickFields, runInBackground, serveRoutes, type RequestContext } from '../_shared/http.ts';
import { getClientIp, requireTurnstile } from '../_shared/turnstile.ts';
import { sendEmail } from '../_shared/correo.ts';
import { revocationNotificationEmail, revocationReceivedEmail } from '../_shared/correo-plantillas.ts';

// Tope de solicitudes por IP. Es holgado a propósito: no puede frenar a quien de verdad se arrepiente.
const MAX_REQUESTS_PER_HOUR = 5;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 20; // VARCHAR(20)
const MIN_DETAILS_LENGTH = 10;
const MAX_DETAILS_LENGTH = 1000;
const MAX_ORDER_NUMBER = 2_147_483_647; // INTEGER

// Mismas reglas que el formulario del frontend: el servidor no puede confiar en que la petición salió de ahí
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[0-9\-\s]*$/;

interface RevocationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  orderNumber: number | null;
  details: string;
}

/** Código de identificación que se le informa a la persona. Sale del id, así que es único. */
function formatCode(id: number | string): string {
  return `ARR-${String(id).padStart(6, '0')}`;
}

/** Texto obligatorio de hasta `max` caracteres, o AppError 400 con el nombre del campo. */
function requiredText(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || value.trim() === '') throw new AppError(`${label} es obligatorio`, 400);
  if (value.length > max) throw new AppError(`${label} no puede superar los ${max} caracteres`, 400);
  return value;
}

// deno-lint-ignore no-explicit-any
function parseInput(body: any): RevocationInput {
  const input = pickFields(body, ['firstName', 'lastName', 'email', 'phone', 'orderNumber', 'details']);

  const firstName = requiredText(input.firstName, 'El nombre', MAX_NAME_LENGTH);
  const lastName = requiredText(input.lastName, 'El apellido', MAX_NAME_LENGTH);

  const email = requiredText(input.email, 'El email', MAX_EMAIL_LENGTH).toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw new AppError('El formato del correo electrónico es inválido', 400);

  const details = requiredText(input.details, 'El detalle de la compra', MAX_DETAILS_LENGTH);
  if (details.length < MIN_DETAILS_LENGTH) {
    throw new AppError(`Contanos un poco más sobre la compra (al menos ${MIN_DETAILS_LENGTH} caracteres)`, 400);
  }

  let phone: string | null = null;
  if (input.phone !== undefined && input.phone !== null && input.phone !== '') {
    if (typeof input.phone !== 'string' || input.phone.length > MAX_PHONE_LENGTH || !PHONE_PATTERN.test(input.phone)) {
      throw new AppError('El teléfono no es válido', 400);
    }
    phone = input.phone;
  }

  let orderNumber: number | null = null;
  if (input.orderNumber !== undefined && input.orderNumber !== null && input.orderNumber !== '') {
    const value = Number(input.orderNumber);
    if (!Number.isInteger(value) || value < 1 || value > MAX_ORDER_NUMBER) {
      throw new AppError('El número de pedido no es válido', 400);
    }
    orderNumber = value;
  }

  return { firstName, lastName, email, phone, orderNumber, details };
}

/** Corta con 429 si esta IP ya hizo demasiadas solicitudes en la última hora. */
async function enforceRateLimit(ip: string): Promise<void> {
  const [{ total }] = await sql`
    select count(*)::int as total from revocation_request
    where ip = ${ip} and created_at > now() - interval '1 hour'
  `;
  if (total >= MAX_REQUESTS_PER_HOUR) {
    throw new AppError(
      'Recibimos muchas solicitudes desde tu conexión. Intentá de nuevo en una hora o escribinos por WhatsApp.',
      429,
    );
  }
}

/**
 * Envía la constancia a la persona y el aviso al comercio. Cada envío es
 * independiente: que falle uno (por ejemplo, un email mal escrito) no impide el otro.
 */
async function sendNotifications(code: string, input: RevocationInput, createdAt: Date): Promise<void> {
  try {
    await sendEmail({
      to: input.email,
      idempotencyKey: `revocation-${code}-customer`,
      ...revocationReceivedEmail({ name: input.firstName, code }),
    });
  } catch (err) {
    console.error(`No se pudo enviar la constancia de ${code}`, err);
  }

  const shopEmail = (Deno.env.get('REVOCATION_NOTIFY_EMAIL') ?? '').trim();
  if (!shopEmail) {
    console.warn(`Falta REVOCATION_NOTIFY_EMAIL: el comercio no fue avisado de la solicitud ${code}`);
    return;
  }

  try {
    await sendEmail({
      to: shopEmail,
      idempotencyKey: `revocation-${code}-shop`,
      ...revocationNotificationEmail({ code, ...input, createdAt }),
    });
  } catch (err) {
    console.error(`No se pudo avisar al comercio de la solicitud ${code}`, err);
  }
}

async function create(ctx: RequestContext) {
  // 1. Validar antes de gastar el token de Turnstile (sirve una sola vez)
  const input = parseInput(ctx.body);

  // 2. Controles anti-abuso
  const ip = getClientIp(ctx.req);
  await enforceRateLimit(ip);
  await requireTurnstile(ctx.req);

  // 3. Guardar y responder con el código
  const [row] = await sql`
    insert into revocation_request (first_name, last_name, email, phone, order_number, details, ip)
    values (${input.firstName}, ${input.lastName}, ${input.email}, ${input.phone}, ${input.orderNumber}, ${input.details}, ${ip})
    returning id, created_at
  `;
  const code = formatCode(row.id);

  // Los correos salen en segundo plano: la respuesta no espera a Resend
  await runInBackground(sendNotifications(code, input, row.createdAt));

  return created('Recibimos tu solicitud de arrepentimiento', { code });
}

serveRoutes('revocations', [['POST', '/', create]]);
