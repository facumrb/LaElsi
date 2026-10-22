-- ============================================================================
-- LaElsi — Aceptación de Términos y botón de arrepentimiento
-- ============================================================================
-- 1. ACEPTACIÓN DE LOS TÉRMINOS
--    El registro tiene una casilla obligatoria: "Leí y acepto los Términos y Condiciones y la
--    Política de Privacidad". Para poder demostrar que la persona aceptó, el servidor guarda CUÁNDO
--    lo hizo y QUÉ versión de los textos tenía delante (fecha AAAA-MM-DD, la misma que muestran las
--    páginas /terminos y /privacidad: fe/.../footer-pages/legal-info.ts).
--    Quedan en NULL las cuentas anteriores, las altas desde el panel de administración y las que
--    se crearon con Google (ahí no hay casilla, solo un aviso).
--
-- 2. BOTÓN DE ARREPENTIMIENTO (Resolución 424/2020 de la Secretaría de Comercio Interior)
--    Quien compró por internet puede revocar la compra dentro de los 10 días (art. 34 de la Ley
--    24.240). La norma exige que el botón esté en el inicio, que NO pida registrarse y que dentro
--    de las 24 horas se informe un código de identificación. Por eso revocation_request guarda
--    solicitudes de personas SIN cuenta: no tiene clave foránea al cliente ni al pedido
--    (order_number es solo lo que la persona escribió, y puede no existir).
--    El código que se informa se arma con el id: ARR-000123 (ver functions/revocations).
--
-- PERMISOS DE LA TABLA NUEVA (revocation_request)
--   Actor                  | Operación                | Resultado
--   anon / authenticated   | SELECT/INSERT/UPDATE/DEL | DENEGADO (RLS activo, sin políticas, y sin GRANT)
--   service_role           | todas                    | permitido (hereda el GRANT por defecto)
--   Edge Function          | INSERT / SELECT          | permitido (se conecta con el dueño de la tabla)
--
-- ROLLBACK
--   DROP TABLE IF EXISTS revocation_request;
--   ALTER TABLE "user" DROP COLUMN IF EXISTS terms_accepted_at, DROP COLUMN IF EXISTS terms_version;
-- ============================================================================

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version     VARCHAR(10);

CREATE TABLE IF NOT EXISTS revocation_request (
  id           BIGSERIAL PRIMARY KEY,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(20),
  -- Lo que la persona escribió: puede no existir, no pertenecer a su cuenta o ser de otra persona
  order_number INTEGER,
  details      TEXT NOT NULL CHECK (char_length(details) <= 2000),
  -- Para limitar solicitudes abusivas desde una misma conexión
  ip           VARCHAR(64) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL = pendiente de gestionar. Lo completa el comercio cuando resuelve la solicitud
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS revocation_request_ip_idx ON revocation_request (ip, created_at);
CREATE INDEX IF NOT EXISTS revocation_request_pending_idx ON revocation_request (created_at) WHERE resolved_at IS NULL;

-- Sin políticas: con RLS activo, la tabla es inaccesible desde la API REST pública
ALTER TABLE revocation_request ENABLE ROW LEVEL SECURITY;
