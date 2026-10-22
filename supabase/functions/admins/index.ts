// ============================================================================
// Edge Function: admins (Tarea 3.6)
// ============================================================================
// Reemplaza a admin.routes.ts + admin.controller.ts + admin.service.ts.
// Todas las rutas son exclusivas de los administradores:
//
//   GET    /admins                   Listado paginado
//   GET    /admins/search?query=     Búsqueda por nombre, apellido, email o DNI
//   GET    /admins/account/:id       Datos de la cuenta
//   GET    /admins/:id
//   POST   /admins
//   PATCH  /admins/:id
//   DELETE /admins/:id
// ============================================================================
import { sql } from '../_shared/db.ts';
import { requireAdmin } from '../_shared/auth.ts';
import {
  AppError,
  created,
  getPagination,
  intParam,
  ok,
  queryParam,
  serveRoutes,
  type RequestContext,
} from '../_shared/http.ts';
import { likePattern } from '../_shared/catalogo.ts';
import { createUser, findUser, listUsers, removeUser, sanitizeUserInput, updateUser } from '../_shared/usuarios.ts';

const NOT_FOUND = 'Administrador no encontrado';

async function getAccountInfo(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const id = intParam(ctx, 'id', 'ID de administrador inválido');
  return ok('Información de cuenta obtenida', await findUser(id, 'Admin', NOT_FOUND));
}

async function findOne(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const id = intParam(ctx, 'id', 'ID de administrador inválido');
  return ok('Administrador encontrado', await findUser(id, 'Admin', NOT_FOUND));
}

async function findAll(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const { page, limit } = getPagination(ctx);
  return ok('Todos los Administradores fueron encontrados', await listUsers('Admin', page, limit));
}

async function searchAdminByText(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const query = queryParam(ctx, 'query');
  if (!query) throw new AppError('El parámetro de búsqueda es requerido', 400);

  const { page, limit } = getPagination(ctx);
  const pattern = likePattern(query);

  const admins = await listUsers(
    'Admin',
    page,
    limit,
    () => sql`and (
      u.name ilike ${pattern} or u.last_name ilike ${pattern}
      or u.email ilike ${pattern} or u.dni ilike ${pattern}
    )`,
  );
  return ok('Resultados de búsqueda', admins);
}

async function add(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const admin = await createUser(sanitizeUserInput(ctx.body, 'Admin'), 'Admin');
  return created('Administrador creado', admin);
}

async function update(ctx: RequestContext) {
  const requester = await requireAdmin(ctx.req);
  const id = intParam(ctx, 'id', 'ID de administrador inválido');

  // Si el administrador edita SU PROPIA cuenta, confirma con la contraseña actual al cambiar el email
  // o la contraseña. Editar a otro administrador no la necesita.
  const admin = await updateUser(id, 'Admin', sanitizeUserInput(ctx.body, 'Admin'), NOT_FOUND, {
    selfEdit: requester.id === id ? { req: ctx.req, currentPassword: ctx.body.currentPassword } : undefined,
  });
  return ok('Administrador actualizado', admin);
}

async function remove(ctx: RequestContext) {
  const requester = await requireAdmin(ctx.req);
  const id = intParam(ctx, 'id', 'ID de administrador inválido');

  // Evita que un administrador se quede sin acceso borrando su propia cuenta por error
  if (requester.id === id) {
    throw new AppError('No podés eliminar tu propia cuenta de administrador', 400);
  }

  await removeUser(id, 'Admin', NOT_FOUND);
  return ok('Administrador eliminado');
}

serveRoutes('admins', [
  // Rutas protegidas (solo Admin puede gestionar admins)
  ['GET', '/', findAll],
  ['GET', '/search', searchAdminByText],
  ['GET', '/account/:id', getAccountInfo],
  ['GET', '/:id', findOne],
  ['POST', '/', add],
  ['DELETE', '/:id', remove],
  ['PATCH', '/:id', update],
]);
