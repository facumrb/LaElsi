-- ============================================================================
-- LaElsi — Recuperación de contraseña ("¿Olvidaste tu contraseña?")
-- ============================================================================
-- Flujo:
--   1. La persona pide recuperar su contraseña (POST /auth/forgot-password).
--   2. El backend genera un token aleatorio, guarda su HASH acá y envía por
--      email (Resend) un enlace que contiene el token.
--   3. La persona abre el enlace, elige una contraseña nueva y el backend
--      canjea el token (POST /auth/reset-password).
--
-- Las contraseñas las guarda Supabase Auth: estas tablas solo llevan el
-- control de los enlaces emitidos.
-- ============================================================================

-- TABLA: PASSWORD_RESET_TOKEN (enlaces de recuperación emitidos)
CREATE TABLE password_reset_token (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  -- Se guarda el SHA-256 del token, nunca el token: si alguien llegara a leer
  -- esta tabla no podría armar un enlace válido. El token real solo existe en
  -- el email que recibe la persona.
  token_hash  VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  -- Fecha en que se usó (o se anuló por haberse emitido uno más nuevo).
  -- Un token con used_at ya no sirve: cada enlace es de un solo uso.
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX password_reset_token_user_idx ON password_reset_token (user_id, created_at);

-- TABLA: PASSWORD_RESET_REQUEST (solicitudes recibidas, por IP)
-- Permite limitar cuántas veces una misma IP puede pedir enlaces, exista o no
-- la cuenta consultada. Protege la cuota de envíos de Resend y evita que se use
-- el formulario para inundar de correos a otra persona.
CREATE TABLE password_reset_request (
  id         BIGSERIAL PRIMARY KEY,
  ip         VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX password_reset_request_ip_idx ON password_reset_request (ip, created_at);

-- Sin políticas: con RLS activo, ninguna de las dos tablas es accesible desde la
-- API REST pública. Solo las usa la Edge Function "auth".
ALTER TABLE password_reset_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_request ENABLE ROW LEVEL SECURITY;
