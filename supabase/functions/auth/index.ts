// ============================================================================
// Edge Function: auth (Tarea 3.1)
// ============================================================================
// Reemplaza a user.routes.ts + user.service.ts. La autenticación la resuelve
// Supabase Auth; esta función cubre lo que Supabase no trae de fábrica:
//
//   POST /auth/login            Inicio de sesión con usuario O email + contraseña
//   POST /auth/register         Registro de clientes con validaciones de negocio
//   GET  /auth/me               Datos de sesión del usuario autenticado
//   POST /auth/verify-password  Confirma la contraseña actual (antes de cambiarla)
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
import { requireUser } from '../_shared/auth.ts';
import { AppError, created, ok, serveRoutes, type RequestContext } from '../_shared/http.ts';
import { createUser, getSessionUser, sanitizeUserInput } from '../_shared/usuarios.ts';
import { getClientIp } from '../_shared/turnstile.ts';

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

serveRoutes('auth', [
  ['POST', '/login', login],
  ['POST', '/register', register],
  ['GET', '/me', me],
  ['POST', '/verify-password', verifyPassword],
]);
