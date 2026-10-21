// ============================================================================
// Autenticación y autorización (reemplaza a verifyToken / verifyRole)
// ============================================================================
// El frontend envía el access token de Supabase Auth en el header
//   Authorization: Bearer <token>
// Acá se valida contra Supabase Auth y se busca el perfil en public."user",
// que es de donde sale el rol (Admin / Client).
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sql } from './db.ts';
import { AppError } from './http.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

/**
 * Cliente con privilegios de servicio. Se usa SOLO para la API de administración
 * de Supabase Auth (validar tokens, crear/editar/borrar cuentas).
 * La service role key nunca sale del servidor.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type UserRole = 'Admin' | 'Client';

export interface AuthUser {
  /** ID del perfil en public."user" (el que usa toda la aplicación) */
  id: number;
  role: UserRole;
  email: string;
  /** ID de la cuenta en Supabase Auth (auth.users) */
  supabaseUid: string;
}

/** Devuelve el usuario autenticado, o null si no hay token o no es válido. */
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const [row] = await sql`
    select id, role, email from "user" where supabase_uid = ${data.user.id}
  `;
  if (!row) return null;

  return { id: row.id, role: row.role, email: row.email, supabaseUid: data.user.id };
}

/** Exige un usuario autenticado (equivale al middleware verifyToken). */
export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getAuthUser(req);
  if (!user) throw new AppError('Token inválido o expirado', 401);
  return user;
}

/** Exige un administrador (equivale a verifyToken + verifyRole([Admin])). */
export async function requireAdmin(req: Request): Promise<AuthUser> {
  const user = await requireUser(req);
  if (user.role !== 'Admin') {
    throw new AppError('Acceso denegado: No tienes permisos suficientes', 403);
  }
  return user;
}

/**
 * Indica si la petición viene de un administrador, SIN exigir sesión: una petición anónima
 * (o con un token inválido) simplemente devuelve false. Sirve para las rutas públicas cuyo
 * contenido cambia según quién consulta (el público ve solo lo activo; el admin ve todo).
 */
export async function isAdminRequest(req: Request): Promise<boolean> {
  return (await getAuthUser(req))?.role === 'Admin';
}

/** Exige que el usuario autenticado sea el dueño del recurso o un administrador. */
export async function requireOwnerOrAdmin(req: Request, ownerId: number): Promise<AuthUser> {
  const user = await requireUser(req);
  if (user.role !== 'Admin' && user.id !== ownerId) {
    throw new AppError('Acceso denegado: No tienes permisos suficientes', 403);
  }
  return user;
}
