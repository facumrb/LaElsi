-- ============================================================================
-- LaElsi — Tarea 1.4: Row Level Security (RLS)
-- ============================================================================
-- Modelo de seguridad:
--   * TODAS las escrituras pasan por las Edge Functions, que validan la sesión y
--     el rol y se conectan a la base con privilegios de servicio (no aplica RLS).
--   * RLS es la defensa en profundidad para el acceso directo a la API REST de
--     Supabase con la clave pública (anon key): solo permite LEER lo que cada
--     uno puede ver, y no permite escribir nada.
--
-- Ajuste respecto del borrador de Tareas.md: la política
--   "Usuario gestiona su propio perfil ... FOR ALL"
-- permitía que cualquier cliente ejecutara UPDATE "user" SET role = 'Admin'
-- sobre su propia fila y se volviera administrador. Por eso acá las políticas
-- son únicamente de lectura (FOR SELECT).
-- ============================================================================

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE price ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_change_batch ENABLE ROW LEVEL SECURITY;
-- login_attempt no tiene políticas: con RLS activo queda inaccesible desde la API REST
ALTER TABLE login_attempt ENABLE ROW LEVEL SECURITY;

-- Helper para verificar rol de Administrador.
-- SECURITY DEFINER: consulta "user" sin pasar por sus políticas (evita recursión).
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."user"
    WHERE supabase_uid = auth.uid() AND role = 'Admin'
  );
$$;

-- Helper: ID del perfil (public."user") del usuario autenticado
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public."user" WHERE supabase_uid = auth.uid();
$$;

-- Catálogo: lectura pública de productos y categorías activas
CREATE POLICY "Catálogo productos público" ON product
  FOR SELECT USING (state = 'Activo' OR is_admin());
CREATE POLICY "Categorías públicas" ON category
  FOR SELECT USING (state = 'Activo' OR is_admin());
CREATE POLICY "Precios actuales públicos" ON price
  FOR SELECT USING (is_current = TRUE OR is_admin());
-- Las fotos son públicas: los archivos ya se sirven desde un bucket público de R2
CREATE POLICY "Fotos públicas" ON photo
  FOR SELECT USING (true);

-- Usuarios: cada uno lee su propio perfil; el Admin lee todos
CREATE POLICY "Usuario lee su propio perfil" ON "user"
  FOR SELECT USING (supabase_uid = auth.uid() OR is_admin());

-- Órdenes: los clientes ven sus propias órdenes; el Admin ve todas
CREATE POLICY "Clientes ven sus órdenes" ON "order"
  FOR SELECT USING (client_id = current_user_id() OR is_admin());
CREATE POLICY "Clientes ven sus líneas de orden" ON order_line
  FOR SELECT USING (
    order_id IN (SELECT id FROM "order" WHERE client_id = current_user_id())
    OR is_admin()
  );

-- Lotes de precios y auditoría: solo accesibles para administradores
CREATE POLICY "Admin lee lotes de precio" ON price_change_batch
  FOR SELECT USING (is_admin());
CREATE POLICY "Admin lee auditoría" ON audit_log
  FOR SELECT USING (is_admin());
