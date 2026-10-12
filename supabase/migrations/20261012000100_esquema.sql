-- ============================================================================
-- LaElsi — Tarea 1.1: Schema de la base de datos (PostgreSQL / Supabase)
-- ============================================================================
-- Traduce las entidades de MikroORM (be/src/**/*.entity.ts) a PostgreSQL.
--
-- Diferencias respecto del borrador de Tareas.md, detectadas al auditar el código:
--   * Los valores de los ENUM son los que realmente usa la aplicación
--     ('Envío', 'Retiro en sucursal', 'Consumidor Final', ...). El frontend
--     envía y espera esos textos exactos.
--   * category incluye parent_id y depth (jerarquía de hasta 3 niveles).
--   * "order" incluye payment_method.
--   * "user" NO guarda contraseñas: las gestiona Supabase Auth (auth.users).
--   * "user" no tiene dtype: era el discriminador de herencia del ORM y es
--     redundante con la columna role.
--   * La unicidad de textos no distingue mayúsculas (como hacía MySQL).
-- ============================================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('Admin', 'Client');
CREATE TYPE category_state AS ENUM ('Activo', 'Inactivo');
CREATE TYPE product_state AS ENUM ('Activo', 'Inactivo');
CREATE TYPE order_state AS ENUM ('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado');
CREATE TYPE delivery_method AS ENUM ('Envío', 'Retiro en sucursal');
CREATE TYPE payment_method AS ENUM ('Transferencia', 'Local');
CREATE TYPE fiscal_condition AS ENUM ('Consumidor Final', 'Responsable Inscripto', 'Monotributista', 'Exento');
CREATE TYPE currency AS ENUM ('ARS', 'USD', 'EUR');
CREATE TYPE photo_type AS ENUM ('product_photo', 'user_photo');
CREATE TYPE adjustment_type AS ENUM ('fixed', 'percentage');

-- TABLA: USER (perfil de la aplicación, vinculado a Supabase Auth por supabase_uid)
CREATE TABLE "user" (
  id                SERIAL PRIMARY KEY,
  -- Vínculo con auth.users. Si se borra el usuario de Auth, el perfil (y su
  -- historial de pedidos) se conserva pero ya no puede iniciar sesión.
  supabase_uid      UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  role              user_role NOT NULL DEFAULT 'Client',
  name              VARCHAR(100),
  last_name         VARCHAR(100),
  dni               VARCHAR(15),
  phone             VARCHAR(20),
  username          VARCHAR(50) NOT NULL,
  email             VARCHAR(255) NOT NULL,

  -- Campos fiscales y de envío (solo los usan los clientes)
  cuit              VARCHAR(11),
  fiscal_condition  fiscal_condition DEFAULT 'Consumidor Final',
  street            VARCHAR(100),
  street_number     INTEGER,
  city              VARCHAR(100),
  province          VARCHAR(100),
  postal_code       VARCHAR(10),
  floor             VARCHAR(5),
  apartment         VARCHAR(5),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- Unicidad sin distinguir mayúsculas (los índices UNIQUE admiten varios NULL)
CREATE UNIQUE INDEX user_email_key ON "user" (lower(email));
CREATE UNIQUE INDEX user_username_key ON "user" (lower(username));
CREATE UNIQUE INDEX user_dni_key ON "user" (dni);
CREATE UNIQUE INDEX user_cuit_key ON "user" (cuit);
CREATE INDEX user_role_idx ON "user" (role);

-- TABLA: CATEGORY (jerárquica: raíz -> subcategoría -> nivel 3)
CREATE TABLE category (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  description VARCHAR(1000),
  "order"     INTEGER NOT NULL DEFAULT 0,
  state       category_state NOT NULL DEFAULT 'Activo',
  parent_id   INTEGER REFERENCES category(id),
  depth       INTEGER NOT NULL DEFAULT 0 CHECK (depth BETWEEN 0 AND 2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX category_name_key ON category (lower(name));
CREATE INDEX category_parent_idx ON category (parent_id);
CREATE INDEX category_order_idx ON category ("order");

-- TABLA: PRODUCT
CREATE TABLE product (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  brand       VARCHAR(100) NOT NULL,
  total_sold  INTEGER NOT NULL DEFAULT 0 CHECK (total_sold >= 0),
  state       product_state NOT NULL DEFAULT 'Activo',
  stock       INTEGER NOT NULL CHECK (stock >= 0),
  category_id INTEGER NOT NULL REFERENCES category(id) ON UPDATE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX product_name_key ON product (lower(name));
CREATE INDEX product_category_idx ON product (category_id);
CREATE INDEX product_state_idx ON product (state);
CREATE INDEX product_total_sold_idx ON product (total_sold DESC);

-- TABLA: PRICE_CHANGE_BATCH (Lotes de actualización masiva de precios)
CREATE TABLE price_change_batch (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES "user"(id),
  adjustment_type  adjustment_type NOT NULL,
  adjustment_value NUMERIC(10,2) NOT NULL,
  rounding_rule    VARCHAR(50),
  is_reverted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

-- TABLA: PRICE (Historial de precios por producto)
CREATE TABLE price (
  id         SERIAL PRIMARY KEY,
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency   currency NOT NULL DEFAULT 'ARS',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  batch_id   INTEGER REFERENCES price_change_batch(id)
);

-- Regla de negocio: cada producto tiene, como máximo, UN precio vigente
CREATE UNIQUE INDEX price_one_current_per_product ON price (product_id) WHERE is_current;
CREATE INDEX price_product_idx ON price (product_id);
CREATE INDEX price_batch_idx ON price (batch_id);

-- TABLA: PHOTO (Metadatos de las imágenes guardadas en Cloudflare R2)
CREATE TABLE photo (
  id            SERIAL PRIMARY KEY,
  type          photo_type NOT NULL,
  file_name     VARCHAR(255) NOT NULL UNIQUE,          -- Key del archivo .webp en R2
  original_name VARCHAR(255),
  mime_type     VARCHAR(50) NOT NULL DEFAULT 'image/webp',
  -- Exclusivo de product_photo: orden dentro del carrusel
  "order"       INTEGER NOT NULL DEFAULT 0,
  product_id    INTEGER REFERENCES product(id) ON DELETE CASCADE,
  -- Exclusivo de user_photo
  user_id       INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
  -- Cada foto pertenece a un producto o a un usuario, según su tipo
  CONSTRAINT photo_owner_check CHECK (
    (type = 'product_photo' AND product_id IS NOT NULL AND user_id IS NULL) OR
    (type = 'user_photo' AND user_id IS NOT NULL AND product_id IS NULL)
  )
);

CREATE INDEX photo_product_idx ON photo (product_id, "order");
-- Cada usuario tiene, como máximo, UNA foto de perfil
CREATE UNIQUE INDEX photo_one_per_user ON photo (user_id) WHERE user_id IS NOT NULL;

-- TABLA: ORDER
CREATE TABLE "order" (
  id              SERIAL PRIMARY KEY,
  client_id       INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status          order_state NOT NULL DEFAULT 'Pendiente',
  delivery_method delivery_method NOT NULL DEFAULT 'Retiro en sucursal',
  payment_method  payment_method NOT NULL DEFAULT 'Transferencia',
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  date_time       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX order_client_idx ON "order" (client_id);
CREATE INDEX order_status_idx ON "order" (status);

-- TABLA: ORDER_LINE
CREATE TABLE order_line (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES product(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  price      NUMERIC(12,2) NOT NULL,                   -- Precio histórico al momento de la compra
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX order_line_order_idx ON order_line (order_id);
CREATE INDEX order_line_product_idx ON order_line (product_id);

-- TABLA: AUDIT_LOG
CREATE TABLE audit_log (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES "user"(id),
  action      VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id   INTEGER,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- TABLA: LOGIN_ATTEMPT (intentos fallidos de inicio de sesión)
-- Reemplaza al loginLimiter de express-rate-limit: máximo 5 intentos fallidos
-- por IP cada 15 minutos. La consulta y la limpieza las hace la Edge Function "auth".
CREATE TABLE login_attempt (
  id         BIGSERIAL PRIMARY KEY,
  ip         VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX login_attempt_ip_idx ON login_attempt (ip, created_at);

-- FUNCIÓN Y TRIGGERS: Auto-actualización de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_category_updated_at BEFORE UPDATE ON category FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_product_updated_at BEFORE UPDATE ON product FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_price_change_batch_updated_at BEFORE UPDATE ON price_change_batch FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_updated_at BEFORE UPDATE ON "order" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_line_updated_at BEFORE UPDATE ON order_line FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_audit_log_updated_at BEFORE UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION update_updated_at();
