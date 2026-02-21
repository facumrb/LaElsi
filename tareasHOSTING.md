📋 Lista completa de tareas para migrar LaElsi a Supabase + Vercel + Cloudflare R2
Las tareas están organizadas en bloques por área y ordenadas por dependencia lógica (las primeras deben hacerse antes que las siguientes).

🗂️ BLOQUE 0 — Preparación y cuentas
Tarea 0.1 — Crear cuenta y proyecto en Supabase
Ir a supabase.com y crear una organización y un proyecto nuevo. Anotar los siguientes valores del panel de Supabase (Project Settings → API):
SUPABASE_URL → URL del proyecto (ej: https://xxxx.supabase.co)
SUPABASE_ANON_KEY → clave pública (para el FE)
SUPABASE_SERVICE_ROLE_KEY → clave privada con permisos totales (solo para el BE / Edge Functions, nunca exponerla en el FE)
Tarea 0.2 — Crear cuenta en Cloudflare y configurar R2
Ir a cloudflare.com y crear una cuenta.
Activar R2 Object Storage (requiere agregar tarjeta, pero el almacenamiento es gratuito hasta 10 GB).
Crear dos buckets:
laelsi-products → para fotos de productos
laelsi-users → para fotos de perfil de usuarios
En cada bucket, configurar acceso público (desde Settings → Public Access → Allow Access). Esto genera una URL base del tipo https://pub-xxxx.r2.dev.
Crear un API Token de R2 con permisos de lectura/escritura (My Profile → API Tokens → Create Token → R2 Storage → Edit). Guardar:
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_PUBLIC_URL_PRODUCTS → URL pública del bucket de productos
R2_PUBLIC_URL_USERS → URL pública del bucket de usuarios
Tarea 0.3 — Crear cuenta en Vercel y conectar el repositorio
Ir a vercel.com y crear una cuenta (se puede vincular con GitHub/GitLab).
Importar el repositorio del proyecto.
Configurar el proyecto apuntando a la carpeta fe/ como root del proyecto Angular.
No hacer deploy todavía — primero hay que actualizar el código del FE.

🗄️ BLOQUE 1 — Base de datos en Supabase (Schema SQL)
Tarea 1.1 — Crear el schema SQL completo en Supabase
En el SQL Editor de Supabase, ejecutar el siguiente schema que traduce todas las entidades del proyecto. Este reemplaza el 
syncSchema() de MikroORM:
sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('Admin', 'Client');
CREATE TYPE category_state AS ENUM ('Activo', 'Inactivo');
CREATE TYPE product_state AS ENUM ('Activo', 'Inactivo');
CREATE TYPE order_state AS ENUM ('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado');
CREATE TYPE delivery_method AS ENUM ('RetiroSucursal', 'Envio');
CREATE TYPE fiscal_condition AS ENUM ('ConsumidorFinal', 'ResponsableInscripto', 'Monotributista', 'Exento');
CREATE TYPE currency AS ENUM ('ARS', 'USD');
CREATE TYPE photo_type AS ENUM ('product_photo', 'user_photo');
CREATE TYPE adjustment_type AS ENUM ('fixed', 'percentage');
-- BASE: columnas comunes (reemplaza CustomBaseEntity)
-- No se crea tabla, se agregan las columnas en cada tabla.
-- USUARIOS (STI: User + Admin + Client en una sola tabla, discriminado por dtype)
CREATE TABLE "user" (
 id            SERIAL PRIMARY KEY,
 dtype         user_role NOT NULL,           -- 'Admin' o 'Client'
 name          VARCHAR(100) NOT NULL,
 last_name     VARCHAR(100) NOT NULL,
 dni           VARCHAR(15) NOT NULL UNIQUE,
 phone         VARCHAR(20) NOT NULL,
 username      VARCHAR(30) NOT NULL UNIQUE,
 password      VARCHAR(100) NOT NULL,
 email         VARCHAR(255) NOT NULL UNIQUE,
 role          user_role NOT NULL,
 -- Campos exclusivos de Client
 cuit                VARCHAR(11) UNIQUE,
 fiscal_condition    fiscal_condition DEFAULT 'ConsumidorFinal',
 street              VARCHAR(100),
 street_number       INTEGER,
 city                VARCHAR(100),
 province            VARCHAR(100),
 postal_code         VARCHAR(10),
 floor               VARCHAR(5),
 apartment           VARCHAR(5),
 -- Timestamps
 created_at    TIMESTAMPTZ DEFAULT NOW(),
 updated_at    TIMESTAMPTZ DEFAULT NOW(),
 deleted_at    TIMESTAMPTZ
);
-- CATEGORÍAS
CREATE TABLE category (
 id          SERIAL PRIMARY KEY,
 name        VARCHAR(50) NOT NULL UNIQUE,
 description VARCHAR(1000),
 state       category_state DEFAULT 'Activo',
 created_at  TIMESTAMPTZ DEFAULT NOW(),
 updated_at  TIMESTAMPTZ DEFAULT NOW(),
 deleted_at  TIMESTAMPTZ
);
-- PRODUCTOS
CREATE TABLE product (
 id          SERIAL PRIMARY KEY,
 name        VARCHAR(50) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 brand       VARCHAR(100) NOT NULL,
 total_sold  INTEGER DEFAULT 0,
 state       product_state DEFAULT 'Activo',
 stock       INTEGER NOT NULL CHECK (stock >= 0),
 category_id INTEGER NOT NULL REFERENCES category(id) ON UPDATE CASCADE,
 created_at  TIMESTAMPTZ DEFAULT NOW(),
 updated_at  TIMESTAMPTZ DEFAULT NOW(),
 deleted_at  TIMESTAMPTZ
);
-- LOTES DE CAMBIO DE PRECIO (PriceChangeBatch)
CREATE TABLE price_change_batch (
 id               SERIAL PRIMARY KEY,
 user_id          INTEGER NOT NULL REFERENCES "user"(id),
 adjustment_type  adjustment_type NOT NULL,
 adjustment_value NUMERIC(10,2) NOT NULL,
 rounding_rule    VARCHAR(50),
 is_reverted      BOOLEAN DEFAULT FALSE,
 created_at       TIMESTAMPTZ DEFAULT NOW(),
 updated_at       TIMESTAMPTZ DEFAULT NOW(),
 deleted_at       TIMESTAMPTZ
);
-- PRECIOS (historial por producto)
CREATE TABLE price (
 id         SERIAL PRIMARY KEY,
 amount     NUMERIC(10,2) NOT NULL,
 currency   currency DEFAULT 'ARS',
 valid_from TIMESTAMPTZ DEFAULT NOW(),
 is_current BOOLEAN DEFAULT TRUE,
 product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
 batch_id   INTEGER REFERENCES price_change_batch(id)
);
-- FOTOS (STI: ProductPhoto y UserPhoto en una sola tabla)
CREATE TABLE photo (
 id            SERIAL PRIMARY KEY,
 type          photo_type NOT NULL,
 file_name     VARCHAR(255) NOT NULL UNIQUE,  -- nombre en R2 (UUID)
 original_name VARCHAR(255) NOT NULL,
 mime_type     VARCHAR(50) NOT NULL,
 -- Exclusivo de product_photo
 "order"       INTEGER,
 product_id    INTEGER REFERENCES product(id) ON DELETE CASCADE,
 -- Exclusivo de user_photo
 user_id       INTEGER REFERENCES "user"(id) ON DELETE CASCADE
);
-- ÓRDENES
CREATE TABLE "order" (
 id              SERIAL PRIMARY KEY,
 client_id       INTEGER NOT NULL REFERENCES "user"(id),
 status          order_state DEFAULT 'Pendiente',
 delivery_method delivery_method DEFAULT 'RetiroSucursal',
 total_amount    NUMERIC(10,2) DEFAULT 0,
 date_time       TIMESTAMPTZ DEFAULT NOW(),
 created_at      TIMESTAMPTZ DEFAULT NOW(),
 updated_at      TIMESTAMPTZ DEFAULT NOW(),
 deleted_at      TIMESTAMPTZ
);
-- LÍNEAS DE ORDEN (OrderLine)
CREATE TABLE order_line (
 id         SERIAL PRIMARY KEY,
 order_id   INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
 product_id INTEGER NOT NULL REFERENCES product(id),
 quantity   INTEGER NOT NULL CHECK (quantity > 0),
 price      NUMERIC(10,2) NOT NULL,   -- precio histórico al momento de la compra
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW(),
 deleted_at TIMESTAMPTZ
);
-- AUDITORÍA
CREATE TABLE audit_log (
 id          SERIAL PRIMARY KEY,
 user_id     INTEGER NOT NULL REFERENCES "user"(id),
 action      VARCHAR(100) NOT NULL,
 target_type VARCHAR(100) NOT NULL,
 target_id   INTEGER,
 details     JSONB,
 created_at  TIMESTAMPTZ DEFAULT NOW(),
 updated_at  TIMESTAMPTZ DEFAULT NOW(),
 deleted_at  TIMESTAMPTZ
);
-- FUNCIÓN: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
 NEW.updated_at = NOW();
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- TRIGGER en cada tabla que necesita updated_at automático
CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_category_updated_at BEFORE UPDATE ON category FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_product_updated_at BEFORE UPDATE ON product FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_price_change_batch_updated_at BEFORE UPDATE ON price_change_batch FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_updated_at BEFORE UPDATE ON "order" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_line_updated_at BEFORE UPDATE ON order_line FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_audit_log_updated_at BEFORE UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION update_updated_at();
Tarea 1.2 — Crear el seed SQL en Supabase
El 
seed.ts actual debe traducirse a SQL para ejecutarse manualmente en el SQL Editor de Supabase (una sola vez). Este script inserta los datos iniciales de administradores, clientes, categorías y productos.
Importante sobre contraseñas: Supabase Auth maneja el hasheo de contraseñas, pero como la tabla 
user es propia (no la tabla auth.users de Supabase), hay que hashear las contraseñas manualmente. Usar la función crypt() de pgcrypto:
sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Admins
INSERT INTO "user" (dtype, name, last_name, dni, email, phone, username, password, role)
VALUES
 ('Admin', 'Super', 'Admin', '11111111', 'admin@laelsi.com', '123456789', 'admin',
  crypt('admin123', gen_salt('bf')), 'Admin'),
 ('Admin', 'Julio', 'Cezar', '44222123', 'juliocezar@gmail.com', '122345678', 'admin1',
  crypt('admin123', gen_salt('bf')), 'Admin');
-- Categorías
INSERT INTO category (name, description, state) VALUES
 ('Libreria', 'Productos de Libreria', 'Activo'),
 ('Jugueteria', 'Productos de Jugueteria', 'Activo'),
 ('Tecnologia', 'Productos de Tecnologia', 'Activo'),
 ('Indumentaria', 'Productos de Indumentaria', 'Inactivo');
-- (Continuar con los productos usando los IDs de categoría retornados por el INSERT anterior)
Nota: Los productos con fotos deben insertarse después de subir las imágenes a R2 (ver Tarea 2.x), porque 
photo.file_name ahora hace referencia al nombre del objeto en R2, no a un archivo local.
Tarea 1.3 — Configurar Row Level Security (RLS) en Supabase
RLS reemplaza los middlewares 
verifyToken y 
verifyRole. Supabase evalúa estas políticas automáticamente en cada consulta.
En el SQL Editor de Supabase:
sql
-- Habilitar RLS en todas las tablas
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE price ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_change_batch ENABLE ROW LEVEL SECURITY;
-- Política: lectura pública para productos y categorías activos
CREATE POLICY "Productos activos son públicos" ON product
 FOR SELECT USING (state = 'Activo');
CREATE POLICY "Categorías activas son públicas" ON category
 FOR SELECT USING (state = 'Activo');
-- Política: solo admins pueden hacer todo en productos
CREATE POLICY "Admins gestionan productos" ON product
 FOR ALL USING (
   EXISTS (
     SELECT 1 FROM "user"
     WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::int
       AND role = 'Admin'
   )
 );
-- (Agregar políticas equivalentes para el resto de tablas según las rutas protegidas del BE actual)
Nota: La forma en que Supabase pasa el usuario autenticado al contexto SQL depende de si se usa Supabase Auth o el JWT propio. Si se usa JWT propio (ver Tarea 3.1), hay que configurar el Secret en Supabase (
Project Settings → Auth → JWT Secret) para que valide los tokens.

☁️ BLOQUE 2 — Storage en Cloudflare R2
Tarea 2.1 — Migrar imágenes existentes de uploads/ a R2
Las imágenes actuales están en 
be/uploads/products/ y be/uploads/users/. Deben subirse a R2 usando la CLI de Wrangler o el SDK de AWS S3 (R2 es compatible con la API de S3):
bash
npm install -g wrangler
wrangler r2 object put laelsi-products/<nombre-archivo> --file=./be/uploads/products/<nombre-archivo>
O bien escribir un script Node.js que suba todos los archivos de la carpeta 
uploads/ al bucket R2 correspondiente usando @aws-sdk/client-s3:
typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
const s3 = new S3Client({
 region: 'auto',
 endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
 credentials: {
   accessKeyId: R2_ACCESS_KEY_ID,
   secretAccessKey: R2_SECRET_ACCESS_KEY,
 },
});
// Iterar sobre los archivos en uploads/products/ y subirlos a laelsi-products
Después de esta tarea, actualizar los registros 
photo.file_name en la base de datos de Supabase para que coincidan con los nombres de objeto en R2.
Tarea 2.2 — Eliminar el middleware Multer del backend
Los archivos 
be/src/photo/multer.config.ts, y toda referencia a multer en photo.routes.ts, productPhoto.controller.ts y userPhoto.controller.ts deben eliminarse. El flujo de subida de archivos cambia por completo: el cliente ya no sube al backend, sino que el backend genera una presigned URL de R2 y el cliente sube directamente a R2.
Tarea 2.3 — Crear Edge Function: generador de presigned URLs para upload
En Supabase, crear una Edge Function llamada 
get-upload-url:
typescript
// supabase/functions/get-upload-url/index.ts
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
const s3 = new S3Client({
 region: 'auto',
 endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
 credentials: {
   accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
   secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
 },
});
Deno.serve(async (req) => {
 const { fileName, bucket, mimeType } = await req.json();
 // Validar que el usuario esté autenticado y tenga el rol correcto (Admin)
 // Validar mimeType (solo images/*)
 // Validar tamaño máximo via Content-Length en headers
  const key = `${crypto.randomUUID()}${extname(fileName)}`;
 const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType });
 const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutos
 return new Response(JSON.stringify({ uploadUrl: url, key }), {
   headers: { 'Content-Type': 'application/json' },
 });
});
El FE usará esta URL para subir el archivo directamente a R2 con un 
PUT y luego notificará al backend con la key resultante para que asocie la foto al producto/usuario en la DB.
Tarea 2.4 — Crear Edge Function: eliminar objeto de R2
En Supabase, crear una Edge Function llamada 
delete-r2-object que reciba la key del objeto y lo elimine del bucket usando el SDK de S3. Esta función reemplaza los fs.unlink() que actualmente hacen productPhoto.controller.ts, userPhoto.controller.ts, admin.controller.ts y client.controller.ts.
Tarea 2.5 — Actualizar URLs de imágenes en el FE
Actualmente el FE construye la URL de imagen como:
http://localhost:3000/uploads/products/<fileName>
Esto debe cambiarse a:
https://pub-xxxx.r2.dev/<fileName>
El cambio se hace en los archivos 
environment.ts y environment.development.ts modificando productImagesUrl y userImagesUrl. Todos los componentes que consumen estas URLs usarán automáticamente los nuevos valores.

⚙️ BLOQUE 3 — Backend: Edge Functions de Supabase
Supabase Edge Functions son funciones TypeScript que corren en Deno. Cada una reemplaza un conjunto de rutas Express actuales.
Tarea 3.1 — Decidir estrategia de autenticación y crear la función login
El proyecto actual usa JWT propio (generado con 
jsonwebtoken). Hay dos opciones:
Opción A (Recomendada): Mantener JWT custom pero validado por Supabase Configurar en 
Project Settings → Auth → JWT Secret el mismo secreto que se usaba en JWT_SECRET. Los claims del JWT se mantienen iguales ({ id, role, email }). Las Edge Functions validan el header Authorization: Bearer <token> extrayendo y verificando el JWT.
Opción B: Migrar a Supabase Auth Usar 
supabase.auth.signInWithPassword(). Requiere crear los usuarios en auth.users (tabla de Supabase) y agregar los campos custom (dni, phone, username, role) en user_metadata. Más esfuerzo, pero más integrado con RLS.
Para cualquiera de las dos opciones, crear la Edge Function 
user-login:
typescript
// supabase/functions/user-login/index.ts
// Recibe { username, password }
// Busca en la tabla "user" por username o email
// Verifica password con: SELECT crypt(password_input, password) = password FROM "user" WHERE username = ...
// Devuelve { token, user: { id, name, lastName, role, photo } }
Tarea 3.2 — Crear Edge Function: user-register
Reemplaza el endpoint 
POST /api/users/register. Acepta los mismos campos que el register actual en user.controller.ts. Hashea la contraseña con pgcrypto (SELECT crypt($1, gen_salt('bf'))) e inserta en la tabla user con dtype = 'Client'.
Tarea 3.3 — Crear Edge Functions para Categorías
Reemplaza 
categoryRouter. Crear las funciones:
category-list → GET /api/categories (público)
category-create → POST /api/categories (solo Admin)
category-update → PATCH /api/categories/:id (solo Admin)
category-delete → DELETE /api/categories/:id (solo Admin)
Se puede agrupar en una sola función con routing interno usando el método HTTP del request.
Tarea 3.4 — Crear Edge Functions para Productos
Reemplaza 
productRouter. Crear las funciones:
product-list → GET /api/products con variantes: /active, /page, /search, /best-sellers, /best-sellers/category/:id, /category/:id, /active/category/:id, /:id
product-create → POST /api/products (solo Admin)
product-update → PATCH /api/products/:id (solo Admin)
product-delete → DELETE /api/products/:id (solo Admin). Al eliminar un producto, también llamar a la Edge Function delete-r2-object para cada foto asociada.
Sobre la búsqueda full-text: la query 
$like: '%texto%' de MikroORM se traduce a ilike '%texto%' en PostgreSQL. Supabase JS Client: supabase.from('product').select().ilike('name', '%query%').
Tarea 3.5 — Crear Edge Functions para Bulk Price Update
Reemplaza 
bulkProduct.controller.ts. Crear las funciones:
bulk-price-preview → POST /api/products/bulk/preview (solo Admin). Lógica pura de cálculo, sin writes a DB.
bulk-price-apply → POST /api/products/bulk/apply (solo Admin). La lógica de aplicar precios, crear price_change_batch, y registrar en audit_log se ejecuta dentro de una transacción PostgreSQL usando supabase.rpc() con una función SQL que garantice atomicidad.
bulk-price-rollback → POST /api/products/bulk/rollback/:batchId (solo Admin). Ídem, en transacción SQL.
bulk-price-history → GET /api/products/bulk/history (solo Admin).
Tarea 3.6 — Crear Edge Functions para Fotos de Productos
Reemplaza 
productPhoto.controller.ts. Crear las funciones:
photo-product-register → POST /api/photos/productPhotos/:productId — recibe la key retornada por R2 tras el upload (Tarea 2.3) y crea el registro en la tabla photo con type = 'product_photo' y product_id.
photo-product-reorder → POST /api/photos/reorder — actualiza el campo order de cada foto. Igual lógica que el actual reorderProductPhotos.
photo-product-delete → DELETE /api/photos/productPhotos/:photoId — elimina el registro de la DB y llama a delete-r2-object para borrar el archivo de R2.
Tarea 3.7 — Crear Edge Functions para Fotos de Usuarios
Reemplaza 
userPhoto.controller.ts. Crear las funciones:
photo-user-upload → POST /api/photos/userPhoto/:userId — valida que el usuario sea el dueño o un Admin, elimina la foto anterior de R2 si existe, luego registra la nueva key en la tabla photo con type = 'user_photo' y user_id.
photo-user-delete → DELETE /api/photos/userPhoto/:photoId — elimina de la DB y de R2.
Tarea 3.8 — Crear Edge Functions para Clientes
Reemplaza 
clientRouter y client.controller.ts. Crear las funciones:
client-list → GET /api/clients (solo Admin)
client-search → GET /api/clients?query=... (solo Admin)
client-get → GET /api/clients/:id (Admin o propio usuario)
client-create → POST /api/clients (solo Admin)
client-update → PATCH /api/clients/:id (Admin o propio usuario). Al actualizar contraseña, hashear con pgcrypto.
client-delete → DELETE /api/clients/:id (solo Admin). Al eliminar, también llamar a delete-r2-object si tiene foto.
Tarea 3.9 — Crear Edge Functions para Administradores
Reemplaza 
adminRouter y admin.controller.ts. Crear las funciones:
admin-list → GET /api/admins (solo Admin)
admin-search → GET /api/admins?query=... (solo Admin)
admin-get → GET /api/admins/:id (solo Admin)
admin-create → POST /api/admins (solo Admin)
admin-update → PATCH /api/admins/:id (solo Admin)
admin-delete → DELETE /api/admins/:id (solo Admin). Al eliminar, también llamar a delete-r2-object si tiene foto.
Tarea 3.10 — Crear Edge Functions para Órdenes
Reemplaza 
orderRouter y order.controller.ts. Crear las funciones:
order-create → POST /api/orders. La lógica de creación (validar stock, descontar stock, actualizar total_sold, insertar líneas) debe ejecutarse en una transacción SQL via supabase.rpc() para garantizar atomicidad igual que el em.flush() actual.
order-list → GET /api/orders (solo Admin)
order-get → GET /api/orders/:id
order-get-by-client → GET /api/orders/client/:clientId
order-update-status → PATCH /api/orders/:id/status. La lógica de changeStatus() con las máquinas de estado (TRANSITIONS_ENVIO, TRANSITIONS_RETIRO) debe replicarse en la Edge Function.
order-update-delivery → PATCH /api/orders/:id/delivery
order-cancel → POST /api/orders/:id/cancel. Al cancelar, restaurar stock y restar de total_sold en la misma transacción SQL.
Tarea 3.11 — Crear función SQL para creación de orden (transacción atómica)
El punto crítico de integridad de datos es la creación y cancelación de órdenes. Crear las funciones en PostgreSQL via 
supabase.rpc():
sql
CREATE OR REPLACE FUNCTION create_order(
 p_client_id INTEGER,
 p_delivery_method delivery_method,
 p_items JSONB  -- [{ productId, quantity }]
) RETURNS INTEGER AS $$
DECLARE
 v_order_id INTEGER;
 v_item JSONB;
 v_product RECORD;
 v_current_price NUMERIC;
BEGIN
 -- Crear orden
 INSERT INTO "order" (client_id, delivery_method) VALUES (p_client_id, p_delivery_method)
 RETURNING id INTO v_order_id;
 -- Procesar cada item
 FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
 LOOP
   SELECT * INTO v_product FROM product WHERE id = (v_item->>'productId')::int FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Producto % no encontrado', v_item->>'productId'; END IF;
   IF v_product.stock < (v_item->>'quantity')::int THEN
     RAISE EXCEPTION 'Stock insuficiente para %', v_product.name;
   END IF;
   SELECT amount INTO v_current_price FROM price WHERE product_id = v_product.id AND is_current = TRUE;
   IF v_current_price IS NULL THEN RAISE EXCEPTION 'Sin precio activo para %', v_product.name; END IF;
   UPDATE product SET stock = stock - (v_item->>'quantity')::int,
                      total_sold = total_sold + (v_item->>'quantity')::int
   WHERE id = v_product.id;
   INSERT INTO order_line (order_id, product_id, quantity, price)
   VALUES (v_order_id, v_product.id, (v_item->>'quantity')::int, v_current_price);
 END LOOP;
 -- Recalcular total
 UPDATE "order" SET total_amount = (
   SELECT SUM(quantity * price) FROM order_line WHERE order_id = v_order_id
 ) WHERE id = v_order_id;
 RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

🖥️ BLOQUE 4 — Frontend Angular: adaptaciones
Tarea 4.1 — Actualizar environment.ts y environment.development.ts
Reemplazar las URLs actuales por las nuevas:
typescript
// environment.development.ts
export const environment = {
 apiUrl: 'https://<proyecto>.supabase.co/functions/v1',
 supabaseUrl: 'https://<proyecto>.supabase.co',
 supabaseAnonKey: '<SUPABASE_ANON_KEY>',
 productImagesUrl: 'https://pub-xxxx.r2.dev/',  // URL pública R2 bucket products
 userImagesUrl: 'https://pub-xxxx.r2.dev/',     // URL pública R2 bucket users
};
// environment.ts (producción)
export const environment = {
 apiUrl: 'https://<proyecto>.supabase.co/functions/v1',
 supabaseUrl: 'https://<proyecto>.supabase.co',
 supabaseAnonKey: '<SUPABASE_ANON_KEY>',
 productImagesUrl: 'https://pub-xxxx.r2.dev/',
 userImagesUrl: 'https://pub-xxxx.r2.dev/',
};
Tarea 4.2 — Actualizar auth.service.ts para el nuevo flujo de login
El servicio actual llama a 
POST /api/users/login con { username, password }. Debe actualizarse para llamar a la nueva Edge Function user-login. La respuesta ({ token, user }) tiene la misma estructura que la actual, por lo que la lógica de saveSession() y los signals no cambian. Solo cambia la URL del endpoint.
Tarea 4.3 — Actualizar auth.interceptor.ts
El interceptor actual agrega 
Authorization: Bearer <token> a todos los requests. Esto no cambia, ya que las Edge Functions de Supabase también esperan el mismo header. No se necesita modificación si la estrategia elegida en la Tarea 3.1 es la Opción A (JWT propio).
Si se elige la Opción B (Supabase Auth), el interceptor debe obtener el token desde 
supabase.auth.getSession() en lugar de desde localStorage.
Tarea 4.4 — Actualizar api-photo.service.ts para el nuevo flujo de upload
El flujo de subida de fotos cambia fundamentalmente. Actualmente:
FE → POST /api/photos/upload/productPhotos/:id con FormData → BE escribe en disco y crea el registro en DB.
Nuevo flujo:
FE → Edge Function get-upload-url → obtiene { uploadUrl, key } de R2
FE → PUT <uploadUrl> con el archivo binario directamente a R2 (sin pasar por el BE)
FE → Edge Function photo-product-register con { key, productId, originalName, mimeType, order } → crea el registro en DB
Actualizar 
api-photo.service.ts para implementar este flujo de 3 pasos. Crear métodos:
getProductPhotoUploadUrl(fileName, mimeType) → llama a get-upload-url
uploadFileToR2(uploadUrl, file) → hace PUT a R2 directamente (HttpClient.put(url, file, { headers: { 'Content-Type': mimeType } }))
registerProductPhoto(key, productId, originalName, mimeType, order) → llama a photo-product-register
El método 
uploadProductPhotos() actual debe refactorizarse para orquestar estos 3 pasos. Lo mismo aplica para uploadUserPhoto().
Tarea 4.5 — Actualizar las URLs de imágenes en los componentes que las consumen
Todos los componentes que construyen la URL de una imagen con 
environment.productImagesUrl + photo.fileName seguirán funcionando igual, ya que solo cambia el valor de productImagesUrl en el archivo de environment. Verificar que ningún componente esté concatenando la URL del servidor anterior hardcodeada (localhost:3000). Buscar en todo el FE:
grep -r "localhost:3000/uploads" fe/src/
Si hay ocurrencias, reemplazarlas por 
environment.productImagesUrl o environment.userImagesUrl.
Tarea 4.6 — Actualizar api-product.service.ts, api-category.service.ts, y todos los demás servicios
Las URLs base de todos los servicios del FE deben apuntar a las nuevas Edge Functions. El patrón actual es:
typescript
private readonly apiUrl = `${environment.apiUrl}/products`;
Como 
environment.apiUrl cambia a https://<proyecto>.supabase.co/functions/v1, y las Edge Functions tienen nombres como product-list, hay que actualizar cada URL de endpoint. Por ejemplo:
typescript
// Antes
`${environment.apiUrl}/products`         // → http://localhost:3000/api/products
// Después
`${environment.apiUrl}/product-list`    // → https://<proyecto>.supabase.co/functions/v1/product-list
Actualizar los servicios: 
api-product.service.ts, api-category.service.ts, api-client.service.ts, api-admin.service.ts, api-order.service.ts, api-photo.service.ts, auth.service.ts.
Tarea 4.7 — Verificar los guards de Angular
Los guards 
admin.guard.ts, auth.guard.ts y guest.guard.ts leen del AuthService (que usa signals basados en localStorage). Este mecanismo no cambia con Supabase (si se elige la Opción A de JWT). Verificar que los guards funcionen correctamente después de los cambios en AuthService.
Tarea 4.8 — Actualizar modelos del FE si cambia la estructura de respuesta
Las respuestas de las Edge Functions de Supabase deben mantener el mismo formato 
{ status, message, data } que devuelve actualmente ApiResponse del BE. Si se mantiene ese formato, los modelos en fe/src/app/models/ no cambian. Si el formato de la respuesta cambia, actualizar los interfaces IApiResponse<T>, IApiProduct, IApiProductPhoto, IApiUserPhoto, UserSession, etc.
Verificar especialmente que los nombres de los campos del nuevo schema SQL (snake_case: 
total_sold, file_name) sean convertidos a camelCase por las Edge Functions antes de devolver la respuesta al FE, ya que el FE espera totalSold, fileName, etc.

🚀 BLOQUE 5 — Despliegue
Tarea 5.1 — Configurar variables de entorno en Supabase para Edge Functions
En 
Project Settings → Edge Functions → Secrets, agregar:
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_PRODUCTS=laelsi-products
R2_BUCKET_USERS=laelsi-users
JWT_SECRET=...  (el mismo que se usaba en el BE actual)
MAX_BULK_DISCOUNT_PERCENTAGE=90
Tarea 5.2 — Desplegar las Edge Functions con la CLI de Supabase
bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy user-login
supabase functions deploy user-register
supabase functions deploy product-list
# ... una por una o con un script de deploy
Tarea 5.3 — Configurar el build de Angular en Vercel
En el panel de Vercel, configurar el proyecto:
Framework Preset: Angular
Root Directory: fe
Build Command: ng build --configuration production
Output Directory: dist/fe/browser
Agregar las Environment Variables en Vercel:
VITE_SUPABASE_URL=https://<proyecto>.supabase.co     (o usar ng build --define)
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
Para Angular (no Vite), las variables de entorno se manejan reemplazando 
environment.ts en el build via fileReplacements en angular.json. Es decir, no se necesitan variables de entorno en Vercel per se — los valores de producción van directamente en environment.ts (sin secretos, solo la anon_key que es pública).
Tarea 5.4 — Crear vercel.json para manejar el routing SPA de Angular
Angular es una SPA: todas las rutas deben redirigir a 
index.html. Sin esto, el refresh en cualquier ruta que no sea / devolverá 404:
json
{
 "rewrites": [
   { "source": "/(.*)", "destination": "/index.html" }
 ]
}
Crear este archivo en 
fe/vercel.json.
Tarea 5.5 — Configurar CORS en las Edge Functions de Supabase
Las Edge Functions de Supabase tienen CORS bloqueado por defecto. Agregar los headers necesarios en cada función:
typescript
const corsHeaders = {
 'Access-Control-Allow-Origin': 'https://<tu-proyecto>.vercel.app',
 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};
Deno.serve(async (req) => {
 if (req.method === 'OPTIONS') {
   return new Response(null, { headers: corsHeaders });
 }
 // ... resto de la función
});
En desarrollo local, agregar también 
http://localhost:4200 al Allow-Origin.

🗑️ BLOQUE 6 — Limpieza del proyecto
Tarea 6.1 — Eliminar el backend Express del repositorio (o moverlo a legacy)
Una vez que todas las Edge Functions estén desplegadas y verificadas, la carpeta 
be/ deja de ser necesaria como servidor de producción. Se puede:
Opción A: Eliminar la carpeta be/ del repositorio.
Opción B: Moverla a be-legacy/ o a una rama legacy/express-backend para referencia histórica.
Si se elige mantenerla para desarrollo local mientras se migra, está bien. Pero el 
package.json raíz debe actualizarse para no incluir dependencias del BE en producción.
Tarea 6.2 — Eliminar dependencias de backend que ya no se necesitan
Del 
be/package.json (y del package.json raíz si las tiene), eliminar:
@mikro-orm/core, @mikro-orm/mysql, @mikro-orm/sql-highlighter
mysql2
multer, @types/multer
express, @types/express
cors, @types/cors
jsonwebtoken, @types/jsonwebtoken, bcrypt, bcryptjs
reflect-metadata
Tarea 6.3 — Actualizar .gitignore y .env.example
Eliminar del .gitignore la referencia a /be/uploads/ (ya no existe almacenamiento local).
Actualizar .env.example para reflejar las nuevas variables necesarias:
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PRODUCTS=laelsi-products
R2_BUCKET_USERS=laelsi-users
R2_PUBLIC_URL_PRODUCTS=https://pub-xxxx.r2.dev
R2_PUBLIC_URL_USERS=https://pub-xxxx.r2.dev
# Seguridad
JWT_SECRET=
MAX_BULK_DISCOUNT_PERCENTAGE=90
Tarea 6.4 — Actualizar el README con la nueva arquitectura
Documentar en 
README.md:
Stack actual: Supabase + Vercel + Cloudflare R2
Cómo correr el FE localmente (cd fe && npm install && ng serve)
Cómo desplegar Edge Functions (supabase functions deploy)
Variables de entorno necesarias
Link al proyecto de Supabase y Vercel

📊 Resumen de tareas
#
Bloque
Tareas
Complejidad
0
Preparación y cuentas
3
🟢 Baja
1
Base de datos (Schema + Seed + RLS)
3
🟡 Media
2
Storage R2
5
🔴 Alta
3
Edge Functions (BE)
11
🔴 Alta
4
Frontend Angular
8
🟡 Media
5
Despliegue
5
🟢 Baja
6
Limpieza
4
🟢 Baja
Total


39 tareas



El orden crítico de ejecución: 0.1 → 0.2 → 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → (resto de Edge Functions) → 4.x → 1.3 (RLS conviene configurarlo último para no bloquear el desarrollo) → 5.x → 6.x
se + Vercel + Cloudflare R2
Las tareas están organizadas en bloques por área y ordenadas por dependencia lógica (las primeras deben hacerse antes que las siguientes).

🗂️ BLOQUE 0 — Preparación y cuentas
Tarea 0.1 — Crear cuenta y proyecto en Supabase
Ir a supabase.com y crear una organización y un proyecto nuevo. Anotar los siguientes valores del panel de Supabase (
Project Settings → API):
SUPABASE_URL → URL del proyecto (ej: https://xxxx.supabase.co)
SUPABASE_ANON_KEY → clave pública (para el FE)
SUPABASE_SERVICE_ROLE_KEY → clave privada con permisos totales (solo para el BE / Edge Functions, nunca exponerla en el FE)
Tarea 0.2 — Crear cuenta en Cloudflare y configurar R2
Ir a cloudflare.com y crear una cuenta.
Activar R2 Object Storage (requiere agregar tarjeta, pero el almacenamiento es gratuito hasta 10 GB).
Crear dos buckets:
laelsi-products → para fotos de productos
laelsi-users → para fotos de perfil de usuarios
En cada bucket, configurar acceso público (desde Settings → Public Access → Allow Access). Esto genera una URL base del tipo https://pub-xxxx.r2.dev.
Crear un API Token de R2 con permisos de lectura/escritura (My Profile → API Tokens → Create Token → R2 Storage → Edit). Guardar:
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_PUBLIC_URL_PRODUCTS → URL pública del bucket de productos
R2_PUBLIC_URL_USERS → URL pública del bucket de usuarios
Tarea 0.3 — Crear cuenta en Vercel y conectar el repositorio
Ir a vercel.com y crear una cuenta (se puede vincular con GitHub/GitLab).
Importar el repositorio del proyecto.
Configurar el proyecto apuntando a la carpeta fe/ como root del proyecto Angular.
No hacer deploy todavía — primero hay que actualizar el código del FE.

🗄️ BLOQUE 1 — Base de datos en Supabase (Schema SQL)
Tarea 1.1 — Crear el schema SQL completo en Supabase
En el SQL Editor de Supabase, ejecutar el siguiente schema que traduce todas las entidades del proyecto. Este reemplaza el 
syncSchema() de MikroORM:
sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('Admin', 'Client');
CREATE TYPE category_state AS ENUM ('Activo', 'Inactivo');
CREATE TYPE product_state AS ENUM ('Activo', 'Inactivo');
CREATE TYPE order_state AS ENUM ('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado');
CREATE TYPE delivery_method AS ENUM ('RetiroSucursal', 'Envio');
CREATE TYPE fiscal_condition AS ENUM ('ConsumidorFinal', 'ResponsableInscripto', 'Monotributista', 'Exento');
CREATE TYPE currency AS ENUM ('ARS', 'USD');
CREATE TYPE photo_type AS ENUM ('product_photo', 'user_photo');
CREATE TYPE adjustment_type AS ENUM ('fixed', 'percentage');
-- BASE: columnas comunes (reemplaza CustomBaseEntity)
-- No se crea tabla, se agregan las columnas en cada tabla.
-- USUARIOS (STI: User + Admin + Client en una sola tabla, discriminado por dtype)
CREATE TABLE "user" (
 id            SERIAL PRIMARY KEY,
 dtype         user_role NOT NULL,           -- 'Admin' o 'Client'
 name          VARCHAR(100) NOT NULL,
 last_name     VARCHAR(100) NOT NULL,
 dni           VARCHAR(15) NOT NULL UNIQUE,
 phone         VARCHAR(20) NOT NULL,
 username      VARCHAR(30) NOT NULL UNIQUE,
 password      VARCHAR(100) NOT NULL,
 email         VARCHAR(255) NOT NULL UNIQUE,
 role          user_role NOT NULL,
 -- Campos exclusivos de Client
 cuit                VARCHAR(11) UNIQUE,
 fiscal_condition    fiscal_condition DEFAULT 'ConsumidorFinal',
 street              VARCHAR(100),
 street_number       INTEGER,
 city                VARCHAR(100),
 province            VARCHAR(100),
 postal_code         VARCHAR(10),
 floor               VARCHAR(5),
 apartment           VARCHAR(5),
 -- Timestamps
 created_at    TIMESTAMPTZ DEFAULT NOW(),
 updated_at    TIMESTAMPTZ DEFAULT NOW(),
 deleted_at    TIMESTAMPTZ
);
-- CATEGORÍAS
CREATE TABLE category (
 id          SERIAL PRIMARY KEY,
 name        VARCHAR(50) NOT NULL UNIQUE,
 description VARCHAR(1000),
 state       category_state DEFAULT 'Activo',
 created_at  TIMESTAMPTZ DEFAULT NOW(),
 updated_at  TIMESTAMPTZ DEFAULT NOW(),
 deleted_at  TIMESTAMPTZ
);
-- PRODUCTOS
CREATE TABLE product (
 id          SERIAL PRIMARY KEY,
 name        VARCHAR(50) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 brand       VARCHAR(100) NOT NULL,
 total_sold  INTEGER DEFAULT 0,
 state       product_state DEFAULT 'Activo',
 stock       INTEGER NOT NULL CHECK (stock >= 0),
 category_id INTEGER NOT NULL REFERENCES category(id) ON UPDATE CASCADE,
 created_at  TIMESTAMPTZ DEFAULT NOW(),
 updated_at  TIMESTAMPTZ DEFAULT NOW(),
 deleted_at  TIMESTAMPTZ
);
-- LOTES DE CAMBIO DE PRECIO (PriceChangeBatch)
CREATE TABLE price_change_batch (
 id               SERIAL PRIMARY KEY,
 user_id          INTEGER NOT NULL REFERENCES "user"(id),
 adjustment_type  adjustment_type NOT NULL,
 adjustment_value NUMERIC(10,2) NOT NULL,
 rounding_rule    VARCHAR(50),
 is_reverted      BOOLEAN DEFAULT FALSE,
 created_at       TIMESTAMPTZ DEFAULT NOW(),
 updated_at       TIMESTAMPTZ DEFAULT NOW(),
 deleted_at       TIMESTAMPTZ
);
-- PRECIOS (historial por producto)
CREATE TABLE price (
 id         SERIAL PRIMARY KEY,
 amount     NUMERIC(10,2) NOT NULL,
 currency   currency DEFAULT 'ARS',
 valid_from TIMESTAMPTZ DEFAULT NOW(),
 is_current BOOLEAN DEFAULT TRUE,
 product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
 batch_id   INTEGER REFERENCES price_change_batch(id)
);
-- FOTOS (STI: ProductPhoto y UserPhoto en una sola tabla)
CREATE TABLE photo (
 id            SERIAL PRIMARY KEY,
 type          photo_type NOT NULL,
 file_name     VARCHAR(255) NOT NULL UNIQUE,  -- nombre en R2 (UUID)
 original_name VARCHAR(255) NOT NULL,
 mime_type     VARCHAR(50) NOT NULL,
 -- Exclusivo de product_photo
 "order"       INTEGER,
 product_id    INTEGER REFERENCES product(id) ON DELETE CASCADE,
 -- Exclusivo de user_photo
 user_id       INTEGER REFERENCES "user"(id) ON DELETE CASCADE
);
-- ÓRDENES
CREATE TABLE "order" (
 id              SERIAL PRIMARY KEY,
 client_id       INTEGER NOT NULL REFERENCES "user"(id),
 status          order_state DEFAULT 'Pendiente',
 delivery_method delivery_method DEFAULT 'RetiroSucursal',
 total_amount    NUMERIC(10,2) DEFAULT 0,
 date_time       TIMESTAMPTZ DEFAULT NOW(),
 created_at      TIMESTAMPTZ DEFAULT NOW(),
 updated_at      TIMESTAMPTZ DEFAULT NOW(),
 deleted_at      TIMESTAMPTZ
);
-- LÍNEAS DE ORDEN (OrderLine)
CREATE TABLE order_line (
 id         SERIAL PRIMARY KEY,
 order_id   INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
 product_id INTEGER NOT NULL REFERENCES product(id),
 quantity   INTEGER NOT NULL CHECK (quantity > 0),
 price      NUMERIC(10,2) NOT NULL,   -- precio histórico al momento de la compra
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW(),
 deleted_at TIMESTAMPTZ
);
-- AUDITORÍA
CREATE TABLE audit_log (
 id          SERIAL PRIMARY KEY,
 user_id     INTEGER NOT NULL REFERENCES "user"(id),
 action      VARCHAR(100) NOT NULL,
 target_type VARCHAR(100) NOT NULL,
 target_id   INTEGER,
 details     JSONB,
 created_at  TIMESTAMPTZ DEFAULT NOW(),
 updated_at  TIMESTAMPTZ DEFAULT NOW(),
 deleted_at  TIMESTAMPTZ
);
-- FUNCIÓN: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
 NEW.updated_at = NOW();
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- TRIGGER en cada tabla que necesita updated_at automático
CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_category_updated_at BEFORE UPDATE ON category FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_product_updated_at BEFORE UPDATE ON product FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_price_change_batch_updated_at BEFORE UPDATE ON price_change_batch FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_updated_at BEFORE UPDATE ON "order" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_line_updated_at BEFORE UPDATE ON order_line FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_audit_log_updated_at BEFORE UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION update_updated_at();
Tarea 1.2 — Crear el seed SQL en Supabase
El 
seed.ts actual debe traducirse a SQL para ejecutarse manualmente en el SQL Editor de Supabase (una sola vez). Este script inserta los datos iniciales de administradores, clientes, categorías y productos.
Importante sobre contraseñas: Supabase Auth maneja el hasheo de contraseñas, pero como la tabla 
user es propia (no la tabla auth.users de Supabase), hay que hashear las contraseñas manualmente. Usar la función crypt() de pgcrypto:
sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Admins
INSERT INTO "user" (dtype, name, last_name, dni, email, phone, username, password, role)
VALUES
 ('Admin', 'Super', 'Admin', '11111111', 'admin@laelsi.com', '123456789', 'admin',
  crypt('admin123', gen_salt('bf')), 'Admin'),
 ('Admin', 'Julio', 'Cezar', '44222123', 'juliocezar@gmail.com', '122345678', 'admin1',
  crypt('admin123', gen_salt('bf')), 'Admin');
-- Categorías
INSERT INTO category (name, description, state) VALUES
 ('Libreria', 'Productos de Libreria', 'Activo'),
 ('Jugueteria', 'Productos de Jugueteria', 'Activo'),
 ('Tecnologia', 'Productos de Tecnologia', 'Activo'),
 ('Indumentaria', 'Productos de Indumentaria', 'Inactivo');
-- (Continuar con los productos usando los IDs de categoría retornados por el INSERT anterior)
Nota: Los productos con fotos deben insertarse después de subir las imágenes a R2 (ver Tarea 2.x), porque 
photo.file_name ahora hace referencia al nombre del objeto en R2, no a un archivo local.
Tarea 1.3 — Configurar Row Level Security (RLS) en Supabase
RLS reemplaza los middlewares 
verifyToken y 
verifyRole. Supabase evalúa estas políticas automáticamente en cada consulta.
En el SQL Editor de Supabase:
sql
-- Habilitar RLS en todas las tablas
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE price ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_change_batch ENABLE ROW LEVEL SECURITY;
-- Política: lectura pública para productos y categorías activos
CREATE POLICY "Productos activos son públicos" ON product
 FOR SELECT USING (state = 'Activo');
CREATE POLICY "Categorías activas son públicas" ON category
 FOR SELECT USING (state = 'Activo');
-- Política: solo admins pueden hacer todo en productos
CREATE POLICY "Admins gestionan productos" ON product
 FOR ALL USING (
   EXISTS (
     SELECT 1 FROM "user"
     WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::int
       AND role = 'Admin'
   )
 );
-- (Agregar políticas equivalentes para el resto de tablas según las rutas protegidas del BE actual)
Nota: La forma en que Supabase pasa el usuario autenticado al contexto SQL depende de si se usa Supabase Auth o el JWT propio. Si se usa JWT propio (ver Tarea 3.1), hay que configurar el Secret en Supabase (
Project Settings → Auth → JWT Secret) para que valide los tokens.

☁️ BLOQUE 2 — Storage en Cloudflare R2
Tarea 2.1 — Migrar imágenes existentes de uploads/ a R2
Las imágenes actuales están en 
be/uploads/products/ y be/uploads/users/. Deben subirse a R2 usando la CLI de Wrangler o el SDK de AWS S3 (R2 es compatible con la API de S3):
bash
npm install -g wrangler
wrangler r2 object put laelsi-products/<nombre-archivo> --file=./be/uploads/products/<nombre-archivo>
O bien escribir un script Node.js que suba todos los archivos de la carpeta 
uploads/ al bucket R2 correspondiente usando @aws-sdk/client-s3:
typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
const s3 = new S3Client({
 region: 'auto',
 endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
 credentials: {
   accessKeyId: R2_ACCESS_KEY_ID,
   secretAccessKey: R2_SECRET_ACCESS_KEY,
 },
});
// Iterar sobre los archivos en uploads/products/ y subirlos a laelsi-products
Después de esta tarea, actualizar los registros 
photo.file_name en la base de datos de Supabase para que coincidan con los nombres de objeto en R2.
Tarea 2.2 — Eliminar el middleware Multer del backend
Los archivos 
be/src/photo/multer.config.ts, y toda referencia a multer en photo.routes.ts, productPhoto.controller.ts y userPhoto.controller.ts deben eliminarse. El flujo de subida de archivos cambia por completo: el cliente ya no sube al backend, sino que el backend genera una presigned URL de R2 y el cliente sube directamente a R2.
Tarea 2.3 — Crear Edge Function: generador de presigned URLs para upload
En Supabase, crear una Edge Function llamada 
get-upload-url:
typescript
// supabase/functions/get-upload-url/index.ts
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
const s3 = new S3Client({
 region: 'auto',
 endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
 credentials: {
   accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
   secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
 },
});
Deno.serve(async (req) => {
 const { fileName, bucket, mimeType } = await req.json();
 // Validar que el usuario esté autenticado y tenga el rol correcto (Admin)
 // Validar mimeType (solo images/*)
 // Validar tamaño máximo via Content-Length en headers
  const key = `${crypto.randomUUID()}${extname(fileName)}`;
 const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType });
 const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutos
 return new Response(JSON.stringify({ uploadUrl: url, key }), {
   headers: { 'Content-Type': 'application/json' },
 });
});
El FE usará esta URL para subir el archivo directamente a R2 con un 
PUT y luego notificará al backend con la key resultante para que asocie la foto al producto/usuario en la DB.
Tarea 2.4 — Crear Edge Function: eliminar objeto de R2
En Supabase, crear una Edge Function llamada 
delete-r2-object que reciba la key del objeto y lo elimine del bucket usando el SDK de S3. Esta función reemplaza los fs.unlink() que actualmente hacen productPhoto.controller.ts, userPhoto.controller.ts, admin.controller.ts y client.controller.ts.
Tarea 2.5 — Actualizar URLs de imágenes en el FE
Actualmente el FE construye la URL de imagen como:
http://localhost:3000/uploads/products/<fileName>
Esto debe cambiarse a:
https://pub-xxxx.r2.dev/<fileName>
El cambio se hace en los archivos 
environment.ts y environment.development.ts modificando productImagesUrl y userImagesUrl. Todos los componentes que consumen estas URLs usarán automáticamente los nuevos valores.

⚙️ BLOQUE 3 — Backend: Edge Functions de Supabase
Supabase Edge Functions son funciones TypeScript que corren en Deno. Cada una reemplaza un conjunto de rutas Express actuales.
Tarea 3.1 — Decidir estrategia de autenticación y crear la función login
El proyecto actual usa JWT propio (generado con 
jsonwebtoken). Hay dos opciones:
Opción A (Recomendada): Mantener JWT custom pero validado por Supabase Configurar en 
Project Settings → Auth → JWT Secret el mismo secreto que se usaba en JWT_SECRET. Los claims del JWT se mantienen iguales ({ id, role, email }). Las Edge Functions validan el header Authorization: Bearer <token> extrayendo y verificando el JWT.
Opción B: Migrar a Supabase Auth Usar 
supabase.auth.signInWithPassword(). Requiere crear los usuarios en auth.users (tabla de Supabase) y agregar los campos custom (dni, phone, username, role) en user_metadata. Más esfuerzo, pero más integrado con RLS.
Para cualquiera de las dos opciones, crear la Edge Function 
user-login:
typescript
// supabase/functions/user-login/index.ts
// Recibe { username, password }
// Busca en la tabla "user" por username o email
// Verifica password con: SELECT crypt(password_input, password) = password FROM "user" WHERE username = ...
// Devuelve { token, user: { id, name, lastName, role, photo } }
Tarea 3.2 — Crear Edge Function: user-register
Reemplaza el endpoint 
POST /api/users/register. Acepta los mismos campos que el register actual en user.controller.ts. Hashea la contraseña con pgcrypto (SELECT crypt($1, gen_salt('bf'))) e inserta en la tabla user con dtype = 'Client'.
Tarea 3.3 — Crear Edge Functions para Categorías
Reemplaza 
categoryRouter. Crear las funciones:
category-list → GET /api/categories (público)
category-create → POST /api/categories (solo Admin)
category-update → PATCH /api/categories/:id (solo Admin)
category-delete → DELETE /api/categories/:id (solo Admin)
Se puede agrupar en una sola función con routing interno usando el método HTTP del request.
Tarea 3.4 — Crear Edge Functions para Productos
Reemplaza 
productRouter. Crear las funciones:
product-list → GET /api/products con variantes: /active, /page, /search, /best-sellers, /best-sellers/category/:id, /category/:id, /active/category/:id, /:id
product-create → POST /api/products (solo Admin)
product-update → PATCH /api/products/:id (solo Admin)
product-delete → DELETE /api/products/:id (solo Admin). Al eliminar un producto, también llamar a la Edge Function delete-r2-object para cada foto asociada.
Sobre la búsqueda full-text: la query 
$like: '%texto%' de MikroORM se traduce a ilike '%texto%' en PostgreSQL. Supabase JS Client: supabase.from('product').select().ilike('name', '%query%').
Tarea 3.5 — Crear Edge Functions para Bulk Price Update
Reemplaza 
bulkProduct.controller.ts. Crear las funciones:
bulk-price-preview → POST /api/products/bulk/preview (solo Admin). Lógica pura de cálculo, sin writes a DB.
bulk-price-apply → POST /api/products/bulk/apply (solo Admin). La lógica de aplicar precios, crear price_change_batch, y registrar en audit_log se ejecuta dentro de una transacción PostgreSQL usando supabase.rpc() con una función SQL que garantice atomicidad.
bulk-price-rollback → POST /api/products/bulk/rollback/:batchId (solo Admin). Ídem, en transacción SQL.
bulk-price-history → GET /api/products/bulk/history (solo Admin).
Tarea 3.6 — Crear Edge Functions para Fotos de Productos
Reemplaza 
productPhoto.controller.ts. Crear las funciones:
photo-product-register → POST /api/photos/productPhotos/:productId — recibe la key retornada por R2 tras el upload (Tarea 2.3) y crea el registro en la tabla photo con type = 'product_photo' y product_id.
photo-product-reorder → POST /api/photos/reorder — actualiza el campo order de cada foto. Igual lógica que el actual reorderProductPhotos.
photo-product-delete → DELETE /api/photos/productPhotos/:photoId — elimina el registro de la DB y llama a delete-r2-object para borrar el archivo de R2.
Tarea 3.7 — Crear Edge Functions para Fotos de Usuarios
Reemplaza 
userPhoto.controller.ts. Crear las funciones:
photo-user-upload → POST /api/photos/userPhoto/:userId — valida que el usuario sea el dueño o un Admin, elimina la foto anterior de R2 si existe, luego registra la nueva key en la tabla photo con type = 'user_photo' y user_id.
photo-user-delete → DELETE /api/photos/userPhoto/:photoId — elimina de la DB y de R2.
Tarea 3.8 — Crear Edge Functions para Clientes
Reemplaza 
clientRouter y client.controller.ts. Crear las funciones:
client-list → GET /api/clients (solo Admin)
client-search → GET /api/clients?query=... (solo Admin)
client-get → GET /api/clients/:id (Admin o propio usuario)
client-create → POST /api/clients (solo Admin)
client-update → PATCH /api/clients/:id (Admin o propio usuario). Al actualizar contraseña, hashear con pgcrypto.
client-delete → DELETE /api/clients/:id (solo Admin). Al eliminar, también llamar a delete-r2-object si tiene foto.
Tarea 3.9 — Crear Edge Functions para Administradores
Reemplaza 
adminRouter y admin.controller.ts. Crear las funciones:
admin-list → GET /api/admins (solo Admin)
admin-search → GET /api/admins?query=... (solo Admin)
admin-get → GET /api/admins/:id (solo Admin)
admin-create → POST /api/admins (solo Admin)
admin-update → PATCH /api/admins/:id (solo Admin)
admin-delete → DELETE /api/admins/:id (solo Admin). Al eliminar, también llamar a delete-r2-object si tiene foto.
Tarea 3.10 — Crear Edge Functions para Órdenes
Reemplaza 
orderRouter y order.controller.ts. Crear las funciones:
order-create → POST /api/orders. La lógica de creación (validar stock, descontar stock, actualizar total_sold, insertar líneas) debe ejecutarse en una transacción SQL via supabase.rpc() para garantizar atomicidad igual que el em.flush() actual.
order-list → GET /api/orders (solo Admin)
order-get → GET /api/orders/:id
order-get-by-client → GET /api/orders/client/:clientId
order-update-status → PATCH /api/orders/:id/status. La lógica de changeStatus() con las máquinas de estado (TRANSITIONS_ENVIO, TRANSITIONS_RETIRO) debe replicarse en la Edge Function.
order-update-delivery → PATCH /api/orders/:id/delivery
order-cancel → POST /api/orders/:id/cancel. Al cancelar, restaurar stock y restar de total_sold en la misma transacción SQL.
Tarea 3.11 — Crear función SQL para creación de orden (transacción atómica)
El punto crítico de integridad de datos es la creación y cancelación de órdenes. Crear las funciones en PostgreSQL via 
supabase.rpc():
sql
CREATE OR REPLACE FUNCTION create_order(
 p_client_id INTEGER,
 p_delivery_method delivery_method,
 p_items JSONB  -- [{ productId, quantity }]
) RETURNS INTEGER AS $$
DECLARE
 v_order_id INTEGER;
 v_item JSONB;
 v_product RECORD;
 v_current_price NUMERIC;
BEGIN
 -- Crear orden
 INSERT INTO "order" (client_id, delivery_method) VALUES (p_client_id, p_delivery_method)
 RETURNING id INTO v_order_id;
 -- Procesar cada item
 FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
 LOOP
   SELECT * INTO v_product FROM product WHERE id = (v_item->>'productId')::int FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Producto % no encontrado', v_item->>'productId'; END IF;
   IF v_product.stock < (v_item->>'quantity')::int THEN
     RAISE EXCEPTION 'Stock insuficiente para %', v_product.name;
   END IF;
   SELECT amount INTO v_current_price FROM price WHERE product_id = v_product.id AND is_current = TRUE;
   IF v_current_price IS NULL THEN RAISE EXCEPTION 'Sin precio activo para %', v_product.name; END IF;
   UPDATE product SET stock = stock - (v_item->>'quantity')::int,
                      total_sold = total_sold + (v_item->>'quantity')::int
   WHERE id = v_product.id;
   INSERT INTO order_line (order_id, product_id, quantity, price)
   VALUES (v_order_id, v_product.id, (v_item->>'quantity')::int, v_current_price);
 END LOOP;
 -- Recalcular total
 UPDATE "order" SET total_amount = (
   SELECT SUM(quantity * price) FROM order_line WHERE order_id = v_order_id
 ) WHERE id = v_order_id;
 RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

🖥️ BLOQUE 4 — Frontend Angular: adaptaciones
Tarea 4.1 — Actualizar environment.ts y environment.development.ts
Reemplazar las URLs actuales por las nuevas:
typescript
// environment.development.ts
export const environment = {
 apiUrl: 'https://<proyecto>.supabase.co/functions/v1',
 supabaseUrl: 'https://<proyecto>.supabase.co',
 supabaseAnonKey: '<SUPABASE_ANON_KEY>',
 productImagesUrl: 'https://pub-xxxx.r2.dev/',  // URL pública R2 bucket products
 userImagesUrl: 'https://pub-xxxx.r2.dev/',     // URL pública R2 bucket users
};
// environment.ts (producción)
export const environment = {
 apiUrl: 'https://<proyecto>.supabase.co/functions/v1',
 supabaseUrl: 'https://<proyecto>.supabase.co',
 supabaseAnonKey: '<SUPABASE_ANON_KEY>',
 productImagesUrl: 'https://pub-xxxx.r2.dev/',
 userImagesUrl: 'https://pub-xxxx.r2.dev/',
};
Tarea 4.2 — Actualizar auth.service.ts para el nuevo flujo de login
El servicio actual llama a 
POST /api/users/login con { username, password }. Debe actualizarse para llamar a la nueva Edge Function user-login. La respuesta ({ token, user }) tiene la misma estructura que la actual, por lo que la lógica de saveSession() y los signals no cambian. Solo cambia la URL del endpoint.
Tarea 4.3 — Actualizar auth.interceptor.ts
El interceptor actual agrega 
Authorization: Bearer <token> a todos los requests. Esto no cambia, ya que las Edge Functions de Supabase también esperan el mismo header. No se necesita modificación si la estrategia elegida en la Tarea 3.1 es la Opción A (JWT propio).
Si se elige la Opción B (Supabase Auth), el interceptor debe obtener el token desde 
supabase.auth.getSession() en lugar de desde localStorage.
Tarea 4.4 — Actualizar api-photo.service.ts para el nuevo flujo de upload
El flujo de subida de fotos cambia fundamentalmente. Actualmente:
FE → POST /api/photos/upload/productPhotos/:id con FormData → BE escribe en disco y crea el registro en DB.
Nuevo flujo:
FE → Edge Function get-upload-url → obtiene { uploadUrl, key } de R2
FE → PUT <uploadUrl> con el archivo binario directamente a R2 (sin pasar por el BE)
FE → Edge Function photo-product-register con { key, productId, originalName, mimeType, order } → crea el registro en DB
Actualizar 
api-photo.service.ts para implementar este flujo de 3 pasos. Crear métodos:
getProductPhotoUploadUrl(fileName, mimeType) → llama a get-upload-url
uploadFileToR2(uploadUrl, file) → hace PUT a R2 directamente (HttpClient.put(url, file, { headers: { 'Content-Type': mimeType } }))
registerProductPhoto(key, productId, originalName, mimeType, order) → llama a photo-product-register
El método 
uploadProductPhotos() actual debe refactorizarse para orquestar estos 3 pasos. Lo mismo aplica para uploadUserPhoto().
Tarea 4.5 — Actualizar las URLs de imágenes en los componentes que las consumen
Todos los componentes que construyen la URL de una imagen con 
environment.productImagesUrl + photo.fileName seguirán funcionando igual, ya que solo cambia el valor de productImagesUrl en el archivo de environment. Verificar que ningún componente esté concatenando la URL del servidor anterior hardcodeada (localhost:3000). Buscar en todo el FE:
grep -r "localhost:3000/uploads" fe/src/
Si hay ocurrencias, reemplazarlas por 
environment.productImagesUrl o environment.userImagesUrl.
Tarea 4.6 — Actualizar api-product.service.ts, api-category.service.ts, y todos los demás servicios
Las URLs base de todos los servicios del FE deben apuntar a las nuevas Edge Functions. El patrón actual es:
typescript
private readonly apiUrl = `${environment.apiUrl}/products`;
Como 
environment.apiUrl cambia a https://<proyecto>.supabase.co/functions/v1, y las Edge Functions tienen nombres como product-list, hay que actualizar cada URL de endpoint. Por ejemplo:
typescript
// Antes
`${environment.apiUrl}/products`         // → http://localhost:3000/api/products
// Después
`${environment.apiUrl}/product-list`    // → https://<proyecto>.supabase.co/functions/v1/product-list
Actualizar los servicios: 
api-product.service.ts, api-category.service.ts, api-client.service.ts, api-admin.service.ts, api-order.service.ts, api-photo.service.ts, auth.service.ts.
Tarea 4.7 — Verificar los guards de Angular
Los guards 
admin.guard.ts, auth.guard.ts y guest.guard.ts leen del AuthService (que usa signals basados en localStorage). Este mecanismo no cambia con Supabase (si se elige la Opción A de JWT). Verificar que los guards funcionen correctamente después de los cambios en AuthService.
Tarea 4.8 — Actualizar modelos del FE si cambia la estructura de respuesta
Las respuestas de las Edge Functions de Supabase deben mantener el mismo formato 
{ status, message, data } que devuelve actualmente ApiResponse del BE. Si se mantiene ese formato, los modelos en fe/src/app/models/ no cambian. Si el formato de la respuesta cambia, actualizar los interfaces IApiResponse<T>, IApiProduct, IApiProductPhoto, IApiUserPhoto, UserSession, etc.
Verificar especialmente que los nombres de los campos del nuevo schema SQL (snake_case: 
total_sold, file_name) sean convertidos a camelCase por las Edge Functions antes de devolver la respuesta al FE, ya que el FE espera totalSold, fileName, etc.

🚀 BLOQUE 5 — Despliegue
Tarea 5.1 — Configurar variables de entorno en Supabase para Edge Functions
En 
Project Settings → Edge Functions → Secrets, agregar:
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_PRODUCTS=laelsi-products
R2_BUCKET_USERS=laelsi-users
JWT_SECRET=...  (el mismo que se usaba en el BE actual)
MAX_BULK_DISCOUNT_PERCENTAGE=90
Tarea 5.2 — Desplegar las Edge Functions con la CLI de Supabase
bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy user-login
supabase functions deploy user-register
supabase functions deploy product-list
# ... una por una o con un script de deploy
Tarea 5.3 — Configurar el build de Angular en Vercel
En el panel de Vercel, configurar el proyecto:
Framework Preset: Angular
Root Directory: fe
Build Command: ng build --configuration production
Output Directory: dist/fe/browser
Agregar las Environment Variables en Vercel:
VITE_SUPABASE_URL=https://<proyecto>.supabase.co     (o usar ng build --define)
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
Para Angular (no Vite), las variables de entorno se manejan reemplazando 
environment.ts en el build via fileReplacements en angular.json. Es decir, no se necesitan variables de entorno en Vercel per se — los valores de producción van directamente en environment.ts (sin secretos, solo la anon_key que es pública).
Tarea 5.4 — Crear vercel.json para manejar el routing SPA de Angular
Angular es una SPA: todas las rutas deben redirigir a 
index.html. Sin esto, el refresh en cualquier ruta que no sea / devolverá 404:
json
{
 "rewrites": [
   { "source": "/(.*)", "destination": "/index.html" }
 ]
}
Crear este archivo en 
fe/vercel.json.
Tarea 5.5 — Configurar CORS en las Edge Functions de Supabase
Las Edge Functions de Supabase tienen CORS bloqueado por defecto. Agregar los headers necesarios en cada función:
typescript
const corsHeaders = {
 'Access-Control-Allow-Origin': 'https://<tu-proyecto>.vercel.app',
 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};
Deno.serve(async (req) => {
 if (req.method === 'OPTIONS') {
   return new Response(null, { headers: corsHeaders });
 }
 // ... resto de la función
});
En desarrollo local, agregar también 
http://localhost:4200 al Allow-Origin.

🗑️ BLOQUE 6 — Limpieza del proyecto
Tarea 6.1 — Eliminar el backend Express del repositorio (o moverlo a legacy)
Una vez que todas las Edge Functions estén desplegadas y verificadas, la carpeta 
be/ deja de ser necesaria como servidor de producción. Se puede:
Opción A: Eliminar la carpeta be/ del repositorio.
Opción B: Moverla a be-legacy/ o a una rama legacy/express-backend para referencia histórica.
Si se elige mantenerla para desarrollo local mientras se migra, está bien. Pero el 
package.json raíz debe actualizarse para no incluir dependencias del BE en producción.
Tarea 6.2 — Eliminar dependencias de backend que ya no se necesitan
Del 
be/package.json (y del package.json raíz si las tiene), eliminar:
@mikro-orm/core, @mikro-orm/mysql, @mikro-orm/sql-highlighter
mysql2
multer, @types/multer
express, @types/express
cors, @types/cors
jsonwebtoken, @types/jsonwebtoken, bcrypt, bcryptjs
reflect-metadata
Tarea 6.3 — Actualizar .gitignore y .env.example
Eliminar del .gitignore la referencia a /be/uploads/ (ya no existe almacenamiento local).
Actualizar .env.example para reflejar las nuevas variables necesarias:
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PRODUCTS=laelsi-products
R2_BUCKET_USERS=laelsi-users
R2_PUBLIC_URL_PRODUCTS=https://pub-xxxx.r2.dev
R2_PUBLIC_URL_USERS=https://pub-xxxx.r2.dev
# Seguridad
JWT_SECRET=
MAX_BULK_DISCOUNT_PERCENTAGE=90
Tarea 6.4 — Actualizar el README con la nueva arquitectura
Documentar en 
README.md:
Stack actual: Supabase + Vercel + Cloudflare R2
Cómo correr el FE localmente (cd fe && npm install && ng serve)
Cómo desplegar Edge Functions (supabase functions deploy)
Variables de entorno necesarias
Link al proyecto de Supabase y Vercel

📊 Resumen de tareas
#
Bloque
Tareas
Complejidad
0
Preparación y cuentas
3
🟢 Baja
1
Base de datos (Schema + Seed + RLS)
3
🟡 Media
2
Storage R2
5
🔴 Alta
3
Edge Functions (BE)
11
🔴 Alta
4
Frontend Angular
8
🟡 Media
5
Despliegue
5
🟢 Baja
6
Limpieza
4
🟢 Baja
Total


39 tareas



El orden crítico de ejecución: 0.1 → 0.2 → 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → (resto de Edge Functions) → 4.x → 1.3 (RLS conviene configurarlo último para no bloquear el desarrollo) → 5.x → 6.x

