// ============================================================================
// Edge Function: clients (Tarea 3.6)
// ============================================================================
// Reemplaza a client.routes.ts + client.controller.ts + client.service.ts.
//
//   Solo Admin
//     GET    /clients                    Listado paginado (filtro por condición fiscal)
//     GET    /clients/search?query=      Búsqueda por nombre, apellido, usuario o DNI
//     GET    /clients/:id
//     POST   /clients
//     DELETE /clients/:id
//   El propio cliente o un Admin
//     GET    /clients/account/:id        Datos de la cuenta
//     PATCH  /clients/:id                Edición del perfil
//
// Ajuste de seguridad respecto del backend anterior: /account/:id y PATCH /:id
// solo exigían estar logueado, así que un cliente podía ver o editar la cuenta
// de otro. Ahora se valida que sea el dueño de la cuenta (o un administrador).
// ============================================================================
import { sql } from '../_shared/db.ts';
import { requireAdmin, requireOwnerOrAdmin } from '../_shared/auth.ts';
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

const NOT_FOUND = 'Cliente no encontrado';

// El historial de órdenes NO viaja con el cliente: crece con cada compra, ninguna pantalla lo lee de
// acá y ya se pide aparte y paginado en GET /orders/client/:clientId.

async function getAccountInfo(ctx: RequestContext) {
  const id = intParam(ctx, 'id', 'ID de cliente inválido');
  await requireOwnerOrAdmin(ctx.req, id);
  return ok('Cuenta encontrada', await findUser(id, 'Client', NOT_FOUND));
}

async function findOne(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const id = intParam(ctx, 'id', 'ID de cliente inválido');
  return ok('Cliente encontrado', await findUser(id, 'Client', NOT_FOUND));
}

async function findAll(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const { page, limit } = getPagination(ctx);
  const fiscalCondition = queryParam(ctx, 'fiscalCondition');

  const clients = await listUsers('Client', page, limit, () =>
    fiscalCondition ? sql`and u.fiscal_condition::text = ${fiscalCondition}` : sql``,
  );
  return ok('Todos los Clientes fueron encontrados', clients);
}

async function searchClientByText(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const query = queryParam(ctx, 'query');
  if (!query) throw new AppError('El parámetro de búsqueda es requerido', 400);

  const { page, limit } = getPagination(ctx);
  const pattern = likePattern(query);

  const clients = await listUsers(
    'Client',
    page,
    limit,
    () => sql`and (
      u.name ilike ${pattern} or u.last_name ilike ${pattern}
      or u.username ilike ${pattern} or u.dni ilike ${pattern}
    )`,
  );
  return ok('Resultados de búsqueda', clients);
}

async function add(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const client = await createUser(sanitizeUserInput(ctx.body, 'Client'), 'Client');

  return created('Usuario registrado exitosamente', {
    id: client.id,
    email: client.email,
    firstName: client.name,
    lastName: client.lastName,
    role: client.role,
  });
}

async function update(ctx: RequestContext) {
  const id = intParam(ctx, 'id', 'ID de cliente inválido');
  const actor = await requireOwnerOrAdmin(ctx.req, id);

  // Quien edita SU PROPIA cuenta confirma con la contraseña actual si cambia el email o la contraseña.
  // Un administrador que edita la cuenta de un cliente no la necesita.
  const client = await updateUser(id, 'Client', sanitizeUserInput(ctx.body, 'Client'), NOT_FOUND, {
    selfEdit: actor.id === id ? { req: ctx.req, currentPassword: ctx.body.currentPassword } : undefined,
  });
  return ok('Datos actualizados correctamente', client);
}

async function remove(ctx: RequestContext) {
  await requireAdmin(ctx.req);
  const id = intParam(ctx, 'id', 'ID de cliente inválido');
  await removeUser(id, 'Client', NOT_FOUND);
  return ok('Cliente eliminado correctamente');
}

serveRoutes('clients', [
  // Rutas protegidas (Admin puede gestionar clientes)
  ['GET', '/', findAll],
  ['GET', '/search', searchClientByText],

  // Usuario logueado puede ver su propia cuenta
  ['GET', '/account/:id', getAccountInfo],

  // Rutas protegidas (Admin puede gestionar clientes)
  ['GET', '/:id', findOne],
  ['POST', '/', add],
  ['DELETE', '/:id', remove],
  ['PATCH', '/:id', update],
]);
