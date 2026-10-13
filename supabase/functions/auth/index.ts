// ============================================================================
// Edge Function: auth (Tarea 3.1)
// ============================================================================
// Reemplaza a user.routes.ts + user.service.ts. La autenticación la resuelve
// Supabase Auth; esta función cubre lo que Supabase no trae de fábrica:
//
//   POST /auth/login                    Inicio de sesión con usuario O email + contraseña
//   POST /auth/register                 Registro de clientes con validaciones de negocio
//   GET  /auth/me                       Datos de sesión del usuario autenticado
//   POST /auth/verify-password          Confirma la contraseña actual (antes de cambiarla)
//   POST /auth/forgot-password          Pide el enlace de recuperación (se envía por email)
//   POST /auth/reset-password/validate  Indica si un enlace de recuperación sigue vigente
//   POST /auth/reset-password           Canjea el enlace y define la contraseña nueva
//
// ¿Por qué el login pasa por acá y no directo por supabase.auth.signInWithPassword?
//   Supabase Auth solo acepta email, y LaElsi permite entrar con el nombre de
//   usuario. Resolver el email en el servidor evita exponer una consulta pública
//   "dame el email de este usuario", que serviría para recolectar direcciones.
//
// Google OAuth y la renovación de tokens NO pasan por acá: los maneja el
// cliente de Supabase directamente en el navegador.
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sql } from '../_shared/db.ts';
import { requireUser, supabaseAdmin } from '../_shared/auth.ts';
import {
  AppError,
  created,
  ok,
  resolveSiteUrl,
  runInBackground,
  serveRoutes,
  type RequestContext,
} from '../_shared/http.ts';
import { createUser, getSessionUser, sanitizeUserInput, validatePasswords } from '../_shared/usuarios.ts';
import { getClientIp, requireTurnstile } from '../_shared/turnstile.ts';
import { assertEmailConfigured, sendEmail } from '../_shared/correo.ts';
import { passwordChangedEmail, passwordResetEmail } from '../_shared/correo-plantillas.ts';
import { generateToken, sha256Hex, TOKEN_PATTERN } from '../_shared/tokens.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Límite de intentos fallidos de login por IP (reemplaza a loginLimiter)
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;

/**
 * Valida email + contraseña contra Supabase Auth y devuelve la sesión.
 * Se usa un cliente descartable con la clave pública: así cada intento es
 * independiente y no se mezclan sesiones entre peticiones.
 */
async function signInWithPassword(email: string, password: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;
  return data.session;
}

async function login(ctx: RequestContext) {
  const { username, email, identifier, password } = ctx.body;
  const loginValue: string = identifier || username || email;

  if (!loginValue) throw new AppError('Usuario o Email requerido', 400);
  if (!password) throw new AppError('Credenciales inválidas', 401);

  const ip = getClientIp(ctx.req);
  const [{ total }] = await sql`
    select count(*)::int as total from login_attempt
    where ip = ${ip} and created_at > now() - make_interval(mins => ${ATTEMPT_WINDOW_MINUTES})
  `;
  if (total >= MAX_FAILED_ATTEMPTS) {
    throw new AppError(
      `Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en ${ATTEMPT_WINDOW_MINUTES} minutos.`,
      429,
    );
  }

  // Se acepta el email o el nombre de usuario (sin distinguir mayúsculas)
  const [profile] = await sql`
    select email from "user"
    where lower(email) = lower(${loginValue}) or lower(username) = lower(${loginValue})
    limit 1
  `;

  const session = profile ? await signInWithPassword(profile.email, String(password)) : null;
  const user = session ? await getSessionUser(session.user.id) : null;

  if (!session || !user) {
    await sql`insert into login_attempt (ip) values (${ip})`;
    // Mismo mensaje exista o no el usuario: no se revela cuál de los dos datos falló
    throw new AppError('Credenciales inválidas', 401);
  }

  // Login correcto: se limpian los intentos de esta IP y los registros viejos
  await sql`delete from login_attempt where ip = ${ip} or created_at < now() - interval '1 day'`;

  return ok('Login exitoso', {
    token: session.access_token,
    refreshToken: session.refresh_token,
    user,
  });
}

async function register(ctx: RequestContext) {
  const input = sanitizeUserInput(ctx.body, 'Client');

  // Los clientes nuevos siempre se crean con rol Client: el rol no se lee del body
  const client = await createUser(input, 'Client', { requireFullProfile: false });
  return created('Usuario registrado exitosamente', { id: client.id });
}

async function me(ctx: RequestContext) {
  const authUser = await requireUser(ctx.req);
  const user = await getSessionUser(authUser.supabaseUid);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return ok('Sesión obtenida', user);
}

async function verifyPassword(ctx: RequestContext) {
  const authUser = await requireUser(ctx.req);
  const password = ctx.body.password;

  const session = password ? await signInWithPassword(authUser.email, String(password)) : null;
  if (!session) {
    // 400 y no 401: el frontend interpreta un 401 como sesión vencida y cierra la sesión
    throw new AppError('Contraseña actual incorrecta', 400);
  }

  return ok('Contraseña verificada');
}

// ─── Recuperación de contraseña ──────────────────────────────────────────────
//
// Resend solo envía el correo. Generar el token, validarlo y cambiar la
// contraseña se resuelve acá, siguiendo las recomendaciones de OWASP:
//   - La respuesta es siempre la misma, exista o no la cuenta (no se pueden
//     averiguar los emails registrados).
//   - El enlace vence a la hora, sirve una sola vez y se anula si se pide otro.
//   - En la base se guarda el hash del token, no el token.
//   - La contraseña nunca viaja por email.

/** Vigencia del enlace de recuperación. */
const RESET_TOKEN_TTL_MINUTES = 60;
/** Máximo de enlaces que puede recibir una misma cuenta por hora. */
const MAX_RESET_EMAILS_PER_HOUR = 3;
/** Máximo de solicitudes que puede hacer una misma IP cada 15 minutos. */
const MAX_RESET_REQUESTS_PER_IP = 5;
const RESET_REQUEST_WINDOW_MINUTES = 15;

// Misma regla que valida el formulario: mínimo 8 caracteres, con al menos una letra y un número
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const MAX_PASSWORD_LENGTH = 100;

const RESET_REQUESTED_MESSAGE =
  'Si los datos corresponden a una cuenta, te enviamos un correo con las instrucciones para restablecer tu contraseña.';
const INVALID_LINK_MESSAGE = 'El enlace no es válido o ya venció. Solicitá uno nuevo.';

interface RecoveryUser {
  id: number;
  email: string;
  name: string | null;
}

/**
 * Busca la cuenta por email, DNI o nombre de usuario (los tres son únicos).
 *
 * Se suma el nombre de usuario a lo pedido originalmente (email o DNI) porque
 * es el dato con el que la gente inicia sesión, y porque las cuentas creadas
 * desde el registro rápido no tienen DNI cargado.
 */
async function findUserForRecovery(identifier: string): Promise<RecoveryUser | null> {
  // Solo las cuentas vinculadas a Supabase Auth tienen una contraseña que cambiar
  const linked = () => sql`supabase_uid is not null`;

  if (identifier.includes('@')) {
    const [user] = await sql`
      select id, email, name from "user" where lower(email) = lower(${identifier}) and ${linked()}
    `;
    return (user as RecoveryUser) ?? null;
  }

  // Un valor numérico se interpreta primero como DNI
  if (/^\d+$/.test(identifier)) {
    const [byDni] = await sql`select id, email, name from "user" where dni = ${identifier} and ${linked()}`;
    if (byDni) return byDni as RecoveryUser;
  }

  const [byUsername] = await sql`
    select id, email, name from "user" where lower(username) = lower(${identifier}) and ${linked()}
  `;
  return (byUsername as RecoveryUser) ?? null;
}

/** Genera el enlace de un solo uso y lo envía por email. Corre en segundo plano. */
async function sendRecoveryLink(user: RecoveryUser, siteUrl: string): Promise<void> {
  // Límite por cuenta: evita que se use el formulario para inundar de correos a alguien
  const [{ total }] = await sql`
    select count(*)::int as total from password_reset_token
    where user_id = ${user.id} and created_at > now() - interval '1 hour'
  `;
  if (total >= MAX_RESET_EMAILS_PER_HOUR) return;

  const token = generateToken();
  const tokenHash = await sha256Hex(token);

  // Solo sirve el último enlace: los anteriores que no se usaron quedan anulados
  await sql`update password_reset_token set used_at = now() where user_id = ${user.id} and used_at is null`;
  await sql`
    insert into password_reset_token (user_id, token_hash, expires_at)
    values (${user.id}, ${tokenHash}, now() + make_interval(mins => ${RESET_TOKEN_TTL_MINUTES}))
  `;

  try {
    await sendEmail({
      to: user.email,
      ...passwordResetEmail({
        name: user.name,
        resetUrl: `${siteUrl}/auth/reset-password?token=${token}`,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      }),
      idempotencyKey: `recuperar-${tokenHash}`,
    });
  } catch (err) {
    // Si el correo no salió, el enlace no le sirve a nadie: se descarta para
    // que no cuente contra el límite cuando la persona vuelva a intentarlo
    await sql`delete from password_reset_token where token_hash = ${tokenHash}`;
    throw err;
  }
}

async function forgotPassword(ctx: RequestContext) {
  const identifier = typeof ctx.body.identifier === 'string' ? ctx.body.identifier : '';

  if (!identifier) throw new AppError('Ingresá tu email, DNI o nombre de usuario', 400);
  if (identifier.length > 255) throw new AppError('El dato ingresado no es válido', 400);

  // Estas validaciones dependen solo del servidor, no de la cuenta consultada
  assertEmailConfigured();
  const siteUrl = resolveSiteUrl(ctx.req);

  // Anti-bots: el formulario es público y cada envío consume cuota de correos
  await requireTurnstile(ctx.req);

  // Límite por IP, se consulte o no una cuenta que exista
  const ip = getClientIp(ctx.req);
  const [{ total }] = await sql`
    select count(*)::int as total from password_reset_request
    where ip = ${ip} and created_at > now() - make_interval(mins => ${RESET_REQUEST_WINDOW_MINUTES})
  `;
  if (total >= MAX_RESET_REQUESTS_PER_IP) {
    throw new AppError(
      `Demasiadas solicitudes. Por favor, intentá de nuevo en ${RESET_REQUEST_WINDOW_MINUTES} minutos.`,
      429,
    );
  }
  await sql`insert into password_reset_request (ip) values (${ip})`;

  // Limpieza de registros viejos (no hace falta un proceso aparte)
  await sql`delete from password_reset_request where created_at < now() - interval '1 day'`;
  await sql`delete from password_reset_token where expires_at < now() - interval '1 day'`;

  const user = await findUserForRecovery(identifier);

  // El correo se envía en segundo plano: la respuesta tarda lo mismo exista o
  // no la cuenta, así que no se puede deducir nada midiendo el tiempo.
  if (user) await runInBackground(sendRecoveryLink(user, siteUrl));

  // Mismo mensaje en todos los casos: no se confirma si la cuenta existe
  return ok(RESET_REQUESTED_MESSAGE);
}

/**
 * Indica si un enlace sigue vigente, SIN gastarlo. La página lo consulta al
 * abrirse para avisar enseguida si el enlace venció, antes de pedir la contraseña.
 *
 * Responde 200 también cuando no es válido: es un resultado esperado, no un error.
 */
async function validateResetToken(ctx: RequestContext) {
  const token = typeof ctx.body.token === 'string' ? ctx.body.token : '';
  if (!TOKEN_PATTERN.test(token)) return ok('Enlace no válido', { valid: false });

  const [row] = await sql`
    select u.username
    from password_reset_token t
    join "user" u on u.id = t.user_id
    where t.token_hash = ${await sha256Hex(token)} and t.used_at is null and t.expires_at > now()
  `;

  if (!row) return ok('Enlace no válido', { valid: false });

  // El nombre de usuario le permite al gestor de contraseñas del navegador
  // guardar la contraseña nueva en la cuenta correcta
  return ok('Enlace válido', { valid: true, username: row.username });
}

/**
 * Cierra las sesiones abiertas de una cuenta, borrándolas de la tabla de
 * sesiones de Supabase Auth. Sin sesión, esos dispositivos ya no pueden renovar
 * su acceso y tienen que volver a iniciar sesión con la contraseña nueva.
 *
 * Dos límites a tener en cuenta:
 *   - Un access token ya emitido sigue sirviendo hasta que vence (dura 1 hora
 *     por defecto): el corte no es instantáneo.
 *   - Es un "mejor esfuerzo": si la base no permite la operación, se registra el
 *     error y el cambio de contraseña, que ya se hizo, sigue siendo válido.
 */
async function revokeSessions(supabaseUid: string): Promise<void> {
  try {
    await sql`delete from auth.sessions where user_id = ${supabaseUid}::uuid`;
  } catch (err) {
    console.error('No se pudieron cerrar las sesiones abiertas de la cuenta', err);
  }
}

async function resetPassword(ctx: RequestContext) {
  const token = typeof ctx.body.token === 'string' ? ctx.body.token : '';
  const { password, confirmPassword } = ctx.body;

  if (!TOKEN_PATTERN.test(token)) throw new AppError(INVALID_LINK_MESSAGE, 400);

  validatePasswords(password, confirmPassword);
  if (typeof password !== 'string' || password.length > MAX_PASSWORD_LENGTH || !PASSWORD_PATTERN.test(password)) {
    throw new AppError('La contraseña debe tener al menos 8 caracteres, con al menos una letra y un número.', 400);
  }

  // Canje atómico: el UPDATE marca el token como usado y lo devuelve en una sola
  // operación. Si llegan dos peticiones con el mismo enlace, solo una lo obtiene.
  const [claimed] = await sql`
    update password_reset_token set used_at = now()
    where token_hash = ${await sha256Hex(token)} and used_at is null and expires_at > now()
    returning id, user_id
  `;
  if (!claimed) throw new AppError(INVALID_LINK_MESSAGE, 400);

  const [user] = await sql`select id, email, name, supabase_uid from "user" where id = ${claimed.userId}`;
  if (!user?.supabaseUid) throw new AppError(INVALID_LINK_MESSAGE, 400);

  // La contraseña la guarda Supabase Auth (hasheada), nunca nuestras tablas
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseUid, { password });
  if (error) {
    // No se pudo cambiar: se libera el enlace para que la persona pueda reintentar
    await sql`update password_reset_token set used_at = null where id = ${claimed.id}`;
    console.error('Error actualizando la contraseña en Supabase Auth', error);
    throw new AppError('No se pudo actualizar la contraseña. Probá con una contraseña distinta.', 400);
  }

  // Cualquier otro enlace pendiente de esa cuenta deja de servir
  await sql`update password_reset_token set used_at = now() where user_id = ${user.id} and used_at is null`;

  // Si alguien más estaba usando la cuenta con la contraseña anterior, se lo desconecta
  await revokeSessions(user.supabaseUid);

  // Aviso de seguridad: si el cambio no lo hizo la persona, así se entera
  await runInBackground(sendEmail({ to: user.email, ...passwordChangedEmail({ name: user.name }) }));

  return ok('Contraseña actualizada correctamente');
}

serveRoutes('auth', [
  ['POST', '/login', login],
  ['POST', '/register', register],
  ['GET', '/me', me],
  ['POST', '/verify-password', verifyPassword],
  ['POST', '/forgot-password', forgotPassword],
  ['POST', '/reset-password/validate', validateResetToken],
  ['POST', '/reset-password', resetPassword],
]);
