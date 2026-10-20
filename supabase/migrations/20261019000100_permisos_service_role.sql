-- ============================================================================
-- LaElsi — Permisos de tabla para service_role
-- ============================================================================
-- service_role saltea RLS, pero NO saltea los GRANT de tabla: son dos capas
-- distintas (primero Postgres pregunta si el rol puede tocar la tabla y recién
-- después qué filas ve). Este proyecto no concede privilegios por defecto a los
-- roles de la Data API, así que sin esto la seed (supabase/seed/seed.mjs) falla
-- con "permission denied for table user".
--
-- Solo se concede a service_role, que es una credencial de servidor. anon y
-- authenticated NO reciben nada: los datos de negocio pasan por las Edge
-- Functions, no por la Data API.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Las tablas y secuencias que se creen en migraciones futuras heredan el permiso
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
