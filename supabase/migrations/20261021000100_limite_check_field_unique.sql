-- ============================================================================
-- LaElsi — Límite de consultas para check_field_unique
-- ============================================================================
-- PROBLEMA
--   Los formularios llaman a check_field_unique directo por la API REST de Supabase con la
--   clave pública (anon), para avisar en vivo si un email, usuario, DNI o CUIT ya está tomado.
--   El backend Express anterior limitaba ese endpoint a 30 consultas por minuto por IP
--   (validationLimiter en be/src/shared/middlewares/rateLimiter.ts). Al migrar, ese límite se
--   perdió: hoy cualquiera con la clave pública (que viaja en el navegador) puede recorrer
--   emails, usuarios, DNI y CUIT sin freno para averiguar quiénes son clientes de la tienda.
--
-- SOLUCIÓN
--   El límite vive dentro de la propia función: entre el navegador y PostgREST no hay otra capa
--   donde ponerlo. Cada consulta se registra en rate_limit_event y, pasadas 30 en el último
--   minuto desde la misma IP, la función responde HTTP 429 (PostgREST traduce el SQLSTATE
--   'PT429' al código de estado 429).
--
-- COMPATIBILIDAD
--   * Misma firma y mismo resultado ({ available, message }): el frontend no cambia.
--   * Pasa de STABLE a VOLATILE porque ahora escribe. PostgREST solo permite llamar a las
--     funciones volátiles por POST, y el frontend ya usa POST.
--   * El formulario trata cualquier error de esta consulta como "sin información" (el servidor
--     vuelve a validar al guardar), así que un 429 no bloquea a nadie: solo deja de avisar en vivo.
--   * Es idempotente: se puede aplicar más de una vez.
--
-- IP DEL CLIENTE
--   Se usa el mismo criterio que getClientIp() de las Edge Functions. El header
--   X-Forwarded-For no es confiable en su primer valor (lo controla el navegador; cada proxy
--   agrega la IP que ve al FINAL), así que se prefiere cf-connecting-ip, que escribe Cloudflare,
--   y si no está, el ÚLTIMO valor de X-Forwarded-For. Lo que no parezca una IP se agrupa bajo
--   'desconocida'.
--
-- PERMISOS DE LA TABLA NUEVA (rate_limit_event)
--   Actor                                | Operación                | Resultado
--   anon / authenticated                 | SELECT/INSERT/UPDATE/DEL | DENEGADO (RLS activo, sin políticas, y sin GRANT)
--   service_role                         | todas                    | permitido (hereda el GRANT por defecto; hoy no la usa)
--   check_field_unique (SECURITY DEFINER)| INSERT/SELECT/DELETE     | permitido (corre con los permisos de su dueño)
--
-- ROLLBACK
--   1. Volver a crear check_field_unique con el cuerpo de 20261012000300_funciones_rpc.sql
--      (la versión STABLE, sin límite).
--   2. DROP TABLE IF EXISTS rate_limit_event;
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_event (
  id         BIGSERIAL PRIMARY KEY,
  -- Qué se está limitando (permite reutilizar la tabla para otras funciones)
  bucket     VARCHAR(50) NOT NULL,
  ip         VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limit_event_lookup_idx ON rate_limit_event (bucket, ip, created_at);

-- Sin políticas: con RLS activo, la tabla es inaccesible desde la API REST pública
ALTER TABLE rate_limit_event ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_field_unique(
  p_entity     TEXT,
  p_field      TEXT,
  p_value      TEXT,
  p_exclude_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c_max_per_minute CONSTANT INTEGER := 30;
  v_value          TEXT := TRIM(COALESCE(p_value, ''));
  v_exists         BOOLEAN;
  v_sensitive      BOOLEAN := p_field IN ('email', 'username', 'dni', 'cuit');
  v_headers        JSONB := COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_forwarded      TEXT[] := string_to_array(COALESCE(v_headers->>'x-forwarded-for', ''), ',');
  v_ip             TEXT;
  v_recent         INTEGER;
BEGIN
  -- 1. Límite por IP: primero el control más barato y el que protege a las demás consultas
  SELECT candidate INTO v_ip
  FROM unnest(ARRAY[
    btrim(COALESCE(v_headers->>'cf-connecting-ip', '')),
    btrim(COALESCE(v_forwarded[cardinality(v_forwarded)], ''))
  ]) WITH ORDINALITY AS t(candidate, position)
  WHERE candidate ~ '^[0-9a-fA-F:.]{3,45}$'
  ORDER BY position
  LIMIT 1;
  v_ip := COALESCE(v_ip, 'desconocida');

  SELECT count(*) INTO v_recent
  FROM rate_limit_event
  WHERE bucket = 'check_field_unique' AND ip = v_ip AND created_at > now() - interval '1 minute';

  IF v_recent >= c_max_per_minute THEN
    RAISE EXCEPTION 'Demasiadas consultas de validación desde esta IP, por favor intente de nuevo en un minuto.'
      USING ERRCODE = 'PT429';
  END IF;

  INSERT INTO rate_limit_event (bucket, ip) VALUES ('check_field_unique', v_ip);

  -- Limpieza ocasional de lo viejo (1 de cada 50 consultas), para no necesitar un proceso aparte
  IF random() < 0.02 THEN
    DELETE FROM rate_limit_event WHERE created_at < now() - interval '1 hour';
  END IF;

  -- 2. Validación de la consulta (sin cambios respecto de la versión anterior)
  IF p_entity IS NULL OR p_field IS NULL OR p_value IS NULL THEN
    RAISE EXCEPTION 'Faltan parámetros requeridos (entity, field, value)' USING ERRCODE = 'LE400';
  END IF;

  IF p_entity IN ('Admin', 'Client') THEN
    IF p_field NOT IN ('email', 'username', 'dni', 'cuit') OR (p_entity = 'Admin' AND p_field = 'cuit') THEN
      RAISE EXCEPTION 'El campo ''%'' no está permitido para validación única en ''%''', p_field, p_entity
        USING ERRCODE = 'LE400';
    END IF;

    -- Se busca entre TODOS los usuarios (admins y clientes comparten tabla e índices únicos)
    SELECT EXISTS (
      SELECT 1 FROM "user" u
      WHERE (p_exclude_id IS NULL OR u.id <> p_exclude_id)
        AND CASE p_field
              WHEN 'email' THEN lower(u.email) = lower(v_value)
              WHEN 'username' THEN lower(u.username) = lower(v_value)
              WHEN 'dni' THEN u.dni = v_value
              WHEN 'cuit' THEN u.cuit = v_value
            END
    ) INTO v_exists;

  ELSIF p_entity = 'Category' AND p_field = 'name' THEN
    SELECT EXISTS (
      SELECT 1 FROM category c
      WHERE lower(c.name) = lower(v_value) AND (p_exclude_id IS NULL OR c.id <> p_exclude_id)
    ) INTO v_exists;

  ELSIF p_entity = 'Product' AND p_field = 'name' THEN
    SELECT EXISTS (
      SELECT 1 FROM product p
      WHERE lower(p.name) = lower(v_value) AND (p_exclude_id IS NULL OR p.id <> p_exclude_id)
    ) INTO v_exists;

  ELSE
    RAISE EXCEPTION 'La combinación ''%.%'' no está soportada para validación única', p_entity, p_field
      USING ERRCODE = 'LE400';
  END IF;

  RETURN jsonb_build_object(
    'available', NOT v_exists,
    'message', CASE
      WHEN NOT v_exists THEN 'Campo disponible'
      -- Para datos sensibles no se confirma qué es lo que ya existe
      WHEN v_sensitive THEN 'Este valor no está disponible'
      ELSE format('El %s ya está en uso', p_field)
    END
  );
END;
$$;

-- Los permisos no cambian: la necesita el formulario de registro (anon), así que sigue siendo pública
REVOKE ALL ON FUNCTION check_field_unique(TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_field_unique(TEXT, TEXT, TEXT, INTEGER) TO anon, authenticated, service_role;
