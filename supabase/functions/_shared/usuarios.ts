// ============================================================================
// Helpers de usuarios compartidos por las funciones auth, clients y admins
// ============================================================================
// Cada usuario vive en dos lugares:
//   - auth.users (Supabase Auth): credenciales. La contraseña NUNCA se guarda
//     en nuestras tablas.
//   - public."user": perfil de la aplicación (rol, datos personales y fiscales).
// El trigger handle_new_auth_user crea el perfil base al dar de alta la cuenta;
// acá se completa con el resto de los datos.
// ============================================================================
import { sql, type Db } from './db.ts';
import { supabaseAdmin, type UserRole } from './auth.ts';
import { AppError, paginated, pickFields } from './http.ts';
import { deleteObject } from './r2.ts';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismas reglas que valida el formulario del frontend (FormUtils.usernamePattern y passwordPattern):
// el servidor no puede confiar en que la petición salió de ese formulario.
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const MAX_USERNAME_LENGTH = 50; // VARCHAR(50)
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const MAX_PASSWORD_LENGTH = 100;

const VALID_FISCAL_CONDITIONS = ['Consumidor Final', 'Responsable Inscripto', 'Monotributista', 'Exento'];

/** Campos de perfil comunes a administradores y clientes. */
const BASE_PROFILE_FIELDS = ['name', 'lastName', 'phone', 'username', 'dni', 'email'];
/** Campos fiscales y de envío, exclusivos de los clientes. */
const CLIENT_PROFILE_FIELDS = [
  'cuit',
  'fiscalCondition',
  'street',
  'streetNumber',
  'city',
  'province',
  'postalCode',
  'floor',
  'apartment',
];
const PASSWORD_FIELDS = ['password', 'confirmPassword'];

const UNIQUE_ERROR = 'Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)';

/** Lanza AppError si las contraseñas no coinciden. */
export function validatePasswords(password?: string, confirmPassword?: string): void {
  if (password && confirmPassword && password !== confirmPassword) {
    throw new AppError('Las contraseñas no coinciden', 400);
  }
}

/** Lanza AppError si la contraseña incumple la política: 8 a 100 caracteres, con al menos una letra y un número. */
export function assertValidPassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length > MAX_PASSWORD_LENGTH || !PASSWORD_PATTERN.test(password)) {
    throw new AppError('La contraseña debe tener al menos 8 caracteres, con al menos una letra y un número.', 400);
  }
}

/**
 * Lanza AppError si el nombre de usuario tiene caracteres no permitidos.
 * Importa también para el login: se puede iniciar sesión con el usuario O con el email, y un
 * usuario con forma de email (con "@") competiría con la cuenta de esa dirección.
 */
export function assertValidUsername(username: unknown): asserts username is string {
  if (typeof username !== 'string' || username.length > MAX_USERNAME_LENGTH || !USERNAME_PATTERN.test(username)) {
    throw new AppError(
      `El nombre de usuario solo admite letras, números, puntos, guiones y guiones bajos (máximo ${MAX_USERNAME_LENGTH} caracteres)`,
      400,
    );
  }
}

/**
 * Columnas del perfil que viajan al frontend: todas menos supabase_uid, que es interna.
 * Se listan a propósito en vez de usar `select *`, así una columna nueva de la tabla no se
 * expone por accidente en cada listado.
 */
const userColumns = () => sql`
  id, role, name, last_name, dni, phone, username, email, cuit, fiscal_condition,
  street, street_number, city, province, postal_code, floor, apartment,
  created_at, updated_at, deleted_at
`;

/**
 * Deja solo los campos permitidos según el rol (reemplaza a sanitizeAdminInput y
 * sanitizeClientInput). El CUIT vacío se descarta para no pisar el valor con ''.
 */
// deno-lint-ignore no-explicit-any
export function sanitizeUserInput(body: any, role: UserRole): Record<string, any> {
  const allowed =
    role === 'Client'
      ? [...BASE_PROFILE_FIELDS, ...CLIENT_PROFILE_FIELDS, ...PASSWORD_FIELDS]
      : [...BASE_PROFILE_FIELDS, ...PASSWORD_FIELDS];

  const input = pickFields(body, allowed);
  if (input.cuit === '') delete input.cuit;
  return input;
}

/** Convierte los datos recibidos en las columnas del perfil (sin credenciales). */
// deno-lint-ignore no-explicit-any
function toProfileColumns(input: Record<string, any>, role: UserRole): Record<string, any> {
  const fields = role === 'Client' ? [...BASE_PROFILE_FIELDS, ...CLIENT_PROFILE_FIELDS] : BASE_PROFILE_FIELDS;
  const columns = pickFields(input, fields);

  if (columns.fiscalCondition !== undefined && !VALID_FISCAL_CONDITIONS.includes(columns.fiscalCondition)) {
    throw new AppError(`Condición fiscal inválida. Las válidas son: ${VALID_FISCAL_CONDITIONS.join(', ')}`, 400);
  }

  if (columns.streetNumber !== undefined && columns.streetNumber !== null && columns.streetNumber !== '') {
    const streetNumber = Number(columns.streetNumber);
    if (!Number.isInteger(streetNumber)) throw new AppError('El número de calle debe ser un número entero', 400);
    columns.streetNumber = streetNumber;
  } else if (columns.streetNumber === '') {
    columns.streetNumber = null;
  }

  // El email se guarda en minúsculas, igual que en Supabase Auth
  if (typeof columns.email === 'string') columns.email = columns.email.toLowerCase();

  return columns;
}

// deno-lint-ignore no-explicit-any
function rethrowUnique(err: any): never {
  if (err?.code === '23505') throw new AppError(UNIQUE_ERROR, 409);
  throw err;
}

// ─── Lectura ─────────────────────────────────────────────────────────────────

/** Agrega a cada usuario su foto de perfil (o null) y quita los campos internos. */
// deno-lint-ignore no-explicit-any
async function attachPhotos(users: any[], db: Db = sql): Promise<any[]> {
  if (users.length === 0) return [];

  const ids = users.map((u) => u.id as number);
  const photos = await db`select id, file_name, user_id from photo where user_id in ${db(ids)}`;
  // deno-lint-ignore no-explicit-any
  const photoByUser = new Map<number, any>(photos.map((p: any) => [p.userId, { id: p.id, fileName: p.fileName }]));

  return users.map(({ supabaseUid: _supabaseUid, ...user }) => ({
    ...user,
    photo: photoByUser.get(user.id) ?? null,
  }));
}

/** Busca un usuario por ID y rol, con su foto. Lanza 404 con el mensaje indicado si no existe. */
export async function findUser(id: number, role: UserRole, notFoundMessage: string) {
  const [row] = await sql`select ${userColumns()} from "user" where id = ${id} and role = ${role}`;
  if (!row) throw new AppError(notFoundMessage, 404);

  const [user] = await attachPhotos([row]);
  return user;
}

/**
 * Lista usuarios de un rol, paginados.
 * `filter` devuelve un fragmento SQL adicional para el WHERE (se usa en dos consultas).
 */
// deno-lint-ignore no-explicit-any
export async function listUsers(role: UserRole, page: number, limit: number, filter: () => any = () => sql``) {
  const offset = (page - 1) * limit;

  const rows = await sql`
    select ${userColumns()} from "user" u
    where u.role = ${role} ${filter()}
    order by u.id asc
    limit ${limit} offset ${offset}
  `;
  const [{ total }] = await sql`
    select count(*)::int as total from "user" u where u.role = ${role} ${filter()}
  `;

  return paginated(await attachPhotos(rows), total, page, limit);
}

/** Datos de sesión que guarda el frontend después de iniciar sesión. */
export async function getSessionUser(supabaseUid: string) {
  const [row] = await sql`
    select id, name, last_name, role from "user" where supabase_uid = ${supabaseUid}
  `;
  if (!row) return null;

  const [photo] = await sql`select id, file_name from photo where user_id = ${row.id}`;
  return {
    id: row.id,
    name: row.name,
    lastName: row.lastName,
    role: row.role,
    photo: photo ? { id: photo.id, fileName: photo.fileName } : null,
  };
}

// ─── Escritura ───────────────────────────────────────────────────────────────

/**
 * Crea un usuario: la cuenta en Supabase Auth y su perfil completo.
 * Si falla el guardado del perfil, se deshace la cuenta para no dejar datos a medias.
 */
export async function createUser(
  // deno-lint-ignore no-explicit-any
  input: Record<string, any>,
  role: UserRole,
  // El alta desde el panel admin exige el perfil completo; el registro público solo las credenciales
  options: { requireFullProfile: boolean } = { requireFullProfile: true },
) {
  const { email, password, confirmPassword, name, lastName, phone, username, dni } = input;

  validatePasswords(password, confirmPassword);

  if (options.requireFullProfile) {
    if (!email || !password || !name || !lastName || !phone || !username || !dni) {
      throw new AppError(
        'Todos los campos obligatorios deben ser proporcionados (email, contraseña, nombre, apellido, teléfono, nombre de usuario, DNI)',
        400,
      );
    }
  } else if (!email || !password || !username) {
    throw new AppError('El email, el nombre de usuario y la contraseña son obligatorios', 400);
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('El formato del correo electrónico es inválido', 400);
  }

  assertValidPassword(password);
  assertValidUsername(username);

  const columns = toProfileColumns(input, role);

  // Se valida la unicidad ANTES de crear la cuenta para devolver un error claro
  const [duplicate] = await sql`
    select id from "user"
    where lower(email) = lower(${email})
       or lower(username) = lower(${username})
       ${dni ? sql`or dni = ${dni}` : sql``}
       ${columns.cuit ? sql`or cuit = ${columns.cuit}` : sql``}
    limit 1
  `;
  if (duplicate) throw new AppError(UNIQUE_ERROR, 409);

  // 1. Cuenta en Supabase Auth. El rol viaja en app_metadata, que el usuario no puede modificar.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name ?? '', last_name: lastName ?? '', username },
    app_metadata: { role },
  });

  if (error || !data.user) {
    if (error?.status === 422 || /already/i.test(error?.message ?? '')) {
      throw new AppError(UNIQUE_ERROR, 409);
    }
    console.error('Error creando la cuenta en Supabase Auth', error);
    throw new AppError('No se pudo crear la cuenta', 500);
  }

  // 2. Perfil: el trigger ya creó la fila base, acá se completa con todos los datos
  try {
    const [user] = await sql`
      update "user" set ${sql({ ...columns, role })}
      where supabase_uid = ${data.user.id}
      returning ${userColumns()}
    `;
    if (!user) throw new Error('El trigger de sincronización no creó el perfil del usuario');

    const [withPhoto] = await attachPhotos([user]);
    return withPhoto;
  } catch (err) {
    // Deshacer: se borra el perfil a medio crear y la cuenta de Auth
    await sql`delete from "user" where supabase_uid = ${data.user.id}`.catch(() => undefined);
    await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    rethrowUnique(err);
  }
}

/**
 * Actualiza un usuario. Los datos de perfil se guardan en public."user"; el email
 * y la contraseña además se sincronizan con Supabase Auth.
 */
// deno-lint-ignore no-explicit-any
export async function updateUser(id: number, role: UserRole, input: Record<string, any>, notFoundMessage: string) {
  const [current] = await sql`select ${userColumns()}, supabase_uid from "user" where id = ${id} and role = ${role}`;
  if (!current) throw new AppError(notFoundMessage, 404);

  if (input.email !== undefined && !EMAIL_REGEX.test(input.email)) {
    throw new AppError('El formato del correo electrónico es inválido', 400);
  }

  validatePasswords(input.password, input.confirmPassword);
  if (input.password) assertValidPassword(input.password);

  // Solo se valida si el usuario cambia: una cuenta heredada con un usuario fuera de la regla
  // tiene que poder seguir editando el resto de su perfil
  if (input.username !== undefined && input.username !== current.username) assertValidUsername(input.username);

  const columns = toProfileColumns(input, role);
  const emailChanged = columns.email !== undefined && columns.email !== String(current.email).toLowerCase();

  // 1. Perfil
  // deno-lint-ignore no-explicit-any
  let updated: any = current;
  if (Object.keys(columns).length > 0) {
    try {
      [updated] = await sql`update "user" set ${sql(columns)} where id = ${id} returning ${userColumns()}`;
    } catch (err) {
      rethrowUnique(err);
    }
  }

  // 2. Credenciales en Supabase Auth
  if ((emailChanged || input.password) && current.supabaseUid) {
    // deno-lint-ignore no-explicit-any
    const authChanges: Record<string, any> = {};
    if (emailChanged) {
      authChanges.email = columns.email;
      authChanges.email_confirm = true;
    }
    if (input.password) authChanges.password = input.password;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(current.supabaseUid, authChanges);
    if (error) {
      // Si Auth rechaza el cambio, el email del perfil vuelve a su valor anterior
      if (emailChanged) await sql`update "user" set email = ${current.email} where id = ${id}`;
      console.error('Error actualizando la cuenta en Supabase Auth', error);
      throw new AppError(
        emailChanged ? 'No se pudo actualizar el email: ya está en uso o no es válido' : 'No se pudo actualizar la contraseña',
        400,
      );
    }
  }

  const [withPhoto] = await attachPhotos([updated]);
  return withPhoto;
}

/** Elimina un usuario: su perfil, su foto de perfil (registro y archivo) y su cuenta de Auth. */
export async function removeUser(id: number, role: UserRole, notFoundMessage: string) {
  const [user] = await sql`select id, supabase_uid from "user" where id = ${id} and role = ${role}`;
  if (!user) throw new AppError(notFoundMessage, 404);

  const [photo] = await sql`select file_name from photo where user_id = ${id}`;

  try {
    // La foto y las órdenes del usuario se borran en cascada (ON DELETE CASCADE)
    await sql`delete from "user" where id = ${id}`;
  } catch (err) {
    // deno-lint-ignore no-explicit-any
    if ((err as any)?.code === '23503') {
      throw new AppError(
        'No se puede eliminar el usuario porque tiene historial asociado (cambios de precios o auditoría)',
        409,
      );
    }
    throw err;
  }

  if (photo) await deleteObject('user', photo.fileName);

  if (user.supabaseUid) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.supabaseUid);
    if (error) console.error('No se pudo eliminar la cuenta de Supabase Auth', error);
  }
}
