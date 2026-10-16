// ============================================================================
// LaElsi — Tarea 1.5: Seed inicial de Supabase
// ============================================================================
// Reemplaza a be/src/shared/db/seed.ts. Carga los datos iniciales usando la
// service role key (los usuarios se crean con la API de administración de
// Supabase Auth, así quedan con su cuenta y su perfil vinculados).
//
// Uso (desde la raíz del repo, con las migraciones ya aplicadas):
//
//   node --env-file=supabase/.env supabase/seed/seed.mjs          # datos base
//   node --env-file=supabase/.env supabase/seed/seed.mjs --demo   # + datos de demostración
//
//   Datos base: el administrador principal, las categorías y los productos reales.
//   --demo:     además carga los administradores y clientes de prueba, los
//               productos de relleno ("... Gen N") y 50 órdenes de ejemplo.
//
// Variables de entorno (van en supabase/.env; ver la plantilla en el README):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   SEED_ADMIN_EMAIL      Email real del administrador principal (obligatoria): recibe el correo de recuperación
//   SEED_ADMIN_PASSWORD   Contraseña del administrador principal (obligatoria, mínimo 12 caracteres)
//   SEED_DEMO_PASSWORD    Contraseña de los usuarios de prueba (obligatoria con --demo, mínimo 12 y distinta de la del admin)
//   SEED_ALLOW_DEMO       Tiene que valer "yes" para usar --demo (evita cargar datos de prueba en producción por error)
//
// Las contraseñas NO están en el repositorio a propósito: el sitio es público y
// una contraseña conocida equivale a dejar el panel de administración abierto.
// Por la misma razón tampoco está el email del administrador principal, y los
// usuarios de demostración usan el dominio reservado example.com, que nunca recibe
// correo: nadie puede quedarse con una de esas cuentas usando "Recuperar contraseña".
//
// El script es idempotente: se puede volver a ejecutar y omite lo que ya existe.
// ============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const isDemo = process.argv.includes('--demo');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_DEMO_PASSWORD, SEED_ALLOW_DEMO } =
  process.env;

const MIN_PASSWORD_LENGTH = 12;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  fail('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (¿usaste --env-file=supabase/.env?)');
}
if (!SEED_ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SEED_ADMIN_EMAIL)) {
  fail('Definí SEED_ADMIN_EMAIL con el email real del administrador principal (recibe el correo de "Recuperar contraseña")');
}
if (!SEED_ADMIN_PASSWORD || SEED_ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
  fail(`Definí SEED_ADMIN_PASSWORD con al menos ${MIN_PASSWORD_LENGTH} caracteres`);
}
if (isDemo && SEED_ALLOW_DEMO !== 'yes') {
  fail('--demo crea decenas de cuentas con datos públicos: no lo uses en producción. Si es un proyecto de pruebas, definí SEED_ALLOW_DEMO=yes');
}
if (isDemo && SEED_DEMO_PASSWORD === SEED_ADMIN_PASSWORD) {
  fail('SEED_DEMO_PASSWORD tiene que ser distinta de SEED_ADMIN_PASSWORD (la primera se comparte entre muchas cuentas)');
}
if (isDemo && (!SEED_DEMO_PASSWORD || SEED_DEMO_PASSWORD.length < MIN_PASSWORD_LENGTH)) {
  fail(`Con --demo hay que definir SEED_DEMO_PASSWORD con al menos ${MIN_PASSWORD_LENGTH} caracteres`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const data = JSON.parse(readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8'));

/** Ejecuta una consulta de Supabase y corta el script si falla. */
async function run(query, context) {
  const { data: rows, error } = await query;
  if (error) fail(`${context}: ${error.message}`);
  return rows;
}

// ─── Usuarios ────────────────────────────────────────────────────────────────

/**
 * Crea un usuario (cuenta de Auth + perfil). Si el email ya existe, lo omite.
 * El rol viaja en app_metadata, que es lo único que lee el trigger para asignarlo.
 */
async function ensureUser(user, role, password) {
  const existing = await run(
    supabase.from('user').select('id').ilike('email', user.email).maybeSingle(),
    `Buscando ${user.email}`,
  );
  if (existing) return false;

  const { data: created, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { name: user.name, last_name: user.lastName, username: user.username },
    app_metadata: { role },
  });
  if (error) fail(`Creando la cuenta de ${user.email}: ${error.message}`);

  // El trigger ya creó el perfil base: se completa con el resto de los datos
  const profile = await run(
    supabase
      .from('user')
      .update({
        role,
        name: user.name,
        last_name: user.lastName,
        dni: user.dni,
        phone: user.phone,
        username: user.username,
        cuit: user.cuit ?? null,
        fiscal_condition: user.fiscalCondition ?? 'Consumidor Final',
        street: user.street ?? null,
        street_number: user.streetNumber ?? null,
        city: user.city ?? null,
        province: user.province ?? null,
        postal_code: user.postalCode ?? null,
        floor: user.floor ?? null,
        apartment: user.apartment ?? null,
      })
      .eq('supabase_uid', created.user.id)
      .select('id')
      .single(),
    `Completando el perfil de ${user.email}`,
  );

  if (user.photoFileName) {
    await run(
      supabase.from('photo').insert({ type: 'user_photo', file_name: user.photoFileName, user_id: profile.id }),
      `Registrando la foto de ${user.email}`,
    );
  }
  return true;
}

/**
 * Los usuarios de demostración usan siempre el dominio reservado example.com (RFC 2606):
 * nunca recibe correo, así que nadie puede quedarse con una de esas cuentas usando
 * "Recuperar contraseña". Se conserva la parte local del email original.
 */
const demoEmail = (email) => email.replace(/@.+$/, '@example.com');

async function seedUsers() {
  const [mainAdmin, ...demoAdmins] = data.admins;

  // El email del administrador principal viene del entorno: no se versiona en seed-data.json
  let created = (await ensureUser({ ...mainAdmin, email: SEED_ADMIN_EMAIL }, 'Admin', SEED_ADMIN_PASSWORD)) ? 1 : 0;

  if (isDemo) {
    for (const admin of demoAdmins) {
      if (await ensureUser({ ...admin, email: demoEmail(admin.email) }, 'Admin', SEED_DEMO_PASSWORD)) created++;
    }
    for (const client of data.clients) {
      // Mismos valores por defecto de dirección que usaba el seed anterior
      const withDefaults = {
        ...client,
        email: demoEmail(client.email),
        city: client.city || 'Rosario',
        province: client.province || 'Santa Fe',
        postalCode: client.postalCode || '2000',
        street: client.street || 'Calle Falsa',
        streetNumber: client.streetNumber || 123,
      };
      if (await ensureUser(withDefaults, 'Client', SEED_DEMO_PASSWORD)) created++;
    }
  }

  console.log(`👤 Usuarios creados: ${created}`);
}

// ─── Categorías ──────────────────────────────────────────────────────────────

async function seedCategories() {
  const existing = await run(supabase.from('category').select('id, name'), 'Leyendo categorías');

  if (existing.length === 0) {
    const insertLevel = async (items, depth, parents) => {
      const rows = items.map((item) => ({
        name: item.name,
        description: item.description,
        state: item.state,
        order: item.order,
        depth,
        parent_id: item.parentName ? parents.get(item.parentName) : null,
        deleted_at: item.state === 'Inactivo' ? new Date().toISOString() : null,
      }));
      const inserted = await run(
        supabase.from('category').insert(rows).select('id, name'),
        `Insertando categorías de nivel ${depth + 1}`,
      );
      return new Map(inserted.map((c) => [c.name, c.id]));
    };

    // Primero las raíces, después cada nivel con el ID de su padre ya conocido
    const roots = await insertLevel(data.categories, 0, new Map());
    const subs = await insertLevel(data.subcategories, 1, roots);
    await insertLevel(data.level3Categories, 2, subs);
    console.log('🗂️  Categorías creadas');
  } else {
    console.log('🗂️  Categorías: ya existían, se omiten');
  }

  const all = await run(supabase.from('category').select('id, name'), 'Leyendo categorías');
  return new Map(all.map((c) => [c.name, c.id]));
}

// ─── Productos ───────────────────────────────────────────────────────────────

async function seedProducts(categoryIds) {
  const { count } = await supabase.from('product').select('id', { count: 'exact', head: true });
  if (count > 0) {
    console.log('📦 Productos: ya existían, se omiten');
    return;
  }

  const products = data.products.filter((p) => categoryIds.has(p.categoryName));

  if (isDemo) {
    // Productos de relleno: completan cada categoría hasta llegar a 20
    for (const name of categoryIds.keys()) {
      const real = data.products.filter((p) => p.categoryName === name).length;
      for (let i = 1; i <= 20 - real; i++) {
        products.push({ name: `${name} Gen ${i}`, price: 1000 + i * 10, categoryName: name });
      }
    }
  }

  const inserted = await run(
    supabase
      .from('product')
      .insert(
        products.map((p) => ({
          name: p.name,
          description: p.description ?? 'Descripción por defecto',
          brand: p.brand ?? 'Generic',
          stock: p.stock ?? 50,
          state: p.state ?? 'Activo',
          total_sold: p.totalSold ?? 0,
          category_id: categoryIds.get(p.categoryName),
          deleted_at: p.state === 'Inactivo' ? new Date().toISOString() : null,
        })),
      )
      .select('id, name'),
    'Insertando productos',
  );
  const productIds = new Map(inserted.map((p) => [p.name, p.id]));

  await run(
    supabase.from('price').insert(
      products.map((p) => ({
        amount: p.price,
        currency: 'ARS',
        is_current: true,
        product_id: productIds.get(p.name),
      })),
    ),
    'Insertando precios',
  );

  // Los nombres de archivo deben coincidir con los que sube subir-imagenes-r2.mjs
  const photos = products.flatMap((p) =>
    (p.photos ?? []).map((photo, index) => ({
      type: 'product_photo',
      file_name: photo.fileName,
      order: index,
      product_id: productIds.get(p.name),
    })),
  );
  if (photos.length > 0) {
    await run(supabase.from('photo').insert(photos), 'Insertando fotos de productos');
  }

  console.log(`📦 Productos creados: ${inserted.length} (${photos.length} fotos)`);
}

// ─── Órdenes de ejemplo ──────────────────────────────────────────────────────

async function seedOrders() {
  const { count } = await supabase.from('order').select('id', { count: 'exact', head: true });
  if (count > 0) {
    console.log('🧾 Órdenes: ya existían, se omiten');
    return;
  }

  const clients = await run(supabase.from('user').select('id, username').eq('role', 'Client'), 'Leyendo clientes');
  const products = await run(supabase.from('product').select('id, name'), 'Leyendo productos');
  const prices = await run(
    supabase.from('price').select('product_id, amount').eq('is_current', true),
    'Leyendo precios',
  );

  const clientIds = new Map(clients.map((c) => [c.username, c.id]));
  const productIds = new Map(products.map((p) => [p.name, p.id]));
  const priceByProduct = new Map(prices.map((p) => [p.product_id, Number(p.amount)]));

  let created = 0;
  for (const order of data.orders) {
    const clientId = clientIds.get(order.clientUsername);
    if (!clientId) {
      console.warn(`⚠️  Cliente "${order.clientUsername}" no encontrado, se omite la orden`);
      continue;
    }

    const lines = order.items
      .filter((item) => productIds.has(item.productName))
      .map((item) => {
        const productId = productIds.get(item.productName);
        return { product_id: productId, quantity: item.quantity, price: priceByProduct.get(productId) ?? 0 };
      });

    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

    const inserted = await run(
      supabase
        .from('order')
        .insert({
          client_id: clientId,
          status: order.status,
          delivery_method: order.deliveryMethod,
          payment_method: order.paymentMethod,
          date_time: order.dateTime,
          total_amount: total,
        })
        .select('id')
        .single(),
      'Insertando orden',
    );

    if (lines.length > 0) {
      await run(
        supabase.from('order_line').insert(lines.map((line) => ({ ...line, order_id: inserted.id }))),
        'Insertando líneas de orden',
      );
    }
    created++;
  }

  console.log(`🧾 Órdenes creadas: ${created}`);
}

// ─── Ejecución ───────────────────────────────────────────────────────────────

console.log(`🌱 Seed de LaElsi (${isDemo ? 'con datos de demostración' : 'solo datos base'})`);

await seedUsers();
const categoryIds = await seedCategories();
await seedProducts(categoryIds);
if (isDemo) await seedOrders();

console.log('🚀 Seed OK');
