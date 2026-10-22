-- ============================================================================
-- LaElsi — Endurecimiento de funciones SQL (revisión de seguridad 2026-10-21)
-- ============================================================================
-- 1. TRIGGER handle_new_auth_user (punto 3 de "Detectado y no implementado")
--    Vinculaba por email un perfil sin cuenta asociada SIN mirar email_confirmed_at. Si en el panel
--    de Supabase estaba desactivado "Confirm email", quien se registrara directo contra
--    /auth/v1/signup con el email de un perfil huérfano (por ejemplo, el de una cuenta de Auth
--    borrada, o uno cargado por el seed) se quedaba con ese perfil y con su rol.
--    Ahora el vínculo con un perfil EXISTENTE exige las dos cosas:
--      * que el email de la cuenta nueva esté confirmado (Google y las altas hechas con la service
--        role lo están), y
--      * que el perfil no tenga ya otra cuenta (supabase_uid IS NULL): nunca se pisa un vínculo.
--    Si no se cumplen, el perfil existente NO se toca y la cuenta nueva queda sin perfil, así que no
--    puede iniciar sesión. Un email nuevo, sin perfil previo, se sigue creando igual que antes.
--
-- 2. MONEDA EN create_order (punto 9)
--    La orden suma importes sin convertir monedas (ARS, USD, EUR). Hoy sirve porque todo está en
--    pesos, pero un producto con precio en dólares habría sumado dólares como si fueran pesos.
--    Ahora create_order rechaza (HTTP 400) un precio que no esté en ARS.
--
-- 3. search_path DE LAS FUNCIONES SECURITY DEFINER (punto 10)
--    Se agrega pg_temp al final: es la práctica recomendada por PostgreSQL. Sin eso, un objeto
--    temporal con el nombre de una tabla podría tapar a la tabla real. No era explotable hoy.
--    check_field_unique ya lo tenía (migración 20261021000100).
--
-- PERMISOS: CREATE OR REPLACE y ALTER FUNCTION conservan los GRANT/REVOKE existentes. No cambia
-- quién puede ejecutar cada función.
--
-- ROLLBACK
--   Volver a crear handle_new_auth_user con el cuerpo de 20261012000200_auth_trigger.sql y create_order
--   con el de 20261012000300_funciones_rpc.sql, y:
--   ALTER FUNCTION cancel_order(INTEGER) SET search_path = public;
--   ALTER FUNCTION is_admin() SET search_path = public;
--   ALTER FUNCTION current_user_id() SET search_path = public;
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Trigger de alta de cuentas
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_meta      JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role      user_role := 'Client';
  v_full_name TEXT;
  v_name      TEXT;
  v_last_name TEXT;
  v_base      TEXT;
  v_username  TEXT;
  v_tries     INTEGER := 0;
BEGIN
  IF COALESCE(NEW.raw_app_meta_data->>'role', '') = 'Admin' THEN
    v_role := 'Admin';
  END IF;

  -- Nombre y apellido: los envía el registro propio (name / last_name). Google solo
  -- informa el nombre completo (full_name / name), así que en ese caso se separa
  -- por el primer espacio.
  v_last_name := NULLIF(TRIM(v_meta->>'last_name'), '');
  v_full_name := COALESCE(
    NULLIF(TRIM(v_meta->>'name'), ''),
    NULLIF(TRIM(v_meta->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  IF v_last_name IS NULL AND position(' ' IN v_full_name) > 0 THEN
    v_name := split_part(v_full_name, ' ', 1);
    v_last_name := TRIM(substring(v_full_name FROM position(' ' IN v_full_name) + 1));
  ELSE
    v_name := v_full_name;
  END IF;

  -- Nombre de usuario: el indicado en el registro o la parte local del email.
  -- Si ya está tomado por otra cuenta se le agrega un sufijo numérico.
  v_base := regexp_replace(
    COALESCE(NULLIF(TRIM(v_meta->>'username'), ''), split_part(NEW.email, '@', 1)),
    '[^a-zA-Z0-9_.-]', '', 'g'
  );
  IF v_base = '' THEN
    v_base := 'usuario';
  END IF;
  v_base := left(v_base, 40);
  v_username := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public."user"
    WHERE lower(username) = lower(v_username) AND lower(email) <> lower(NEW.email)
  ) LOOP
    v_tries := v_tries + 1;
    EXIT WHEN v_tries > 20;
    v_username := v_base || '_' || (floor(random() * 9000) + 1000)::int;
  END LOOP;

  -- Si ya existía un perfil con ese email (por ejemplo, creado por el seed) se lo vincula a la
  -- cuenta de Auth en lugar de duplicarlo, pero SOLO si el email de la cuenta está confirmado y el
  -- perfil no tiene ya otra cuenta. Si no, el perfil existente queda intacto.
  INSERT INTO public."user" (supabase_uid, role, email, name, last_name, username)
  VALUES (NEW.id, v_role, NEW.email, left(v_name, 100), left(COALESCE(v_last_name, ''), 100), v_username)
  ON CONFLICT (lower(email)) DO UPDATE
    SET supabase_uid = EXCLUDED.supabase_uid
    WHERE public."user".supabase_uid IS NULL
      AND NEW.email_confirmed_at IS NOT NULL;

  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2 y 3. create_order: solo pesos, y search_path con pg_temp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_order(
  p_client_id       INTEGER,
  p_delivery_method delivery_method,
  p_payment_method  payment_method,
  p_items           JSONB -- Array de [{ "productId": 1, "quantity": 2 }]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id INTEGER;
  v_item     JSONB;
  v_product  product%ROWTYPE;
  v_quantity INTEGER;
  v_price    NUMERIC;
  v_currency currency;
  v_total    NUMERIC := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "user" WHERE id = p_client_id AND role = 'Client') THEN
    RAISE EXCEPTION 'Cliente no encontrado' USING ERRCODE = 'LE404';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La orden debe contener al menos un producto' USING ERRCODE = 'LE400';
  END IF;

  IF p_payment_method = 'Local' AND p_delivery_method = 'Envío' THEN
    RAISE EXCEPTION 'El pago en el local no está disponible para envíos a domicilio. Por favor, seleccione Transferencia.'
      USING ERRCODE = 'LE400';
  END IF;

  -- Crear la cabecera de la orden
  INSERT INTO "order" (client_id, delivery_method, payment_method, status)
  VALUES (p_client_id, p_delivery_method, p_payment_method, 'Pendiente')
  RETURNING id INTO v_order_id;

  -- Procesar cada producto con bloqueo FOR UPDATE contra condiciones de carrera
  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items) ORDER BY (value->>'productId')::int
  LOOP
    v_quantity := (v_item->>'quantity')::int;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'La cantidad del producto (ID: %) debe ser un entero positivo', (v_item->>'productId')
        USING ERRCODE = 'LE400';
    END IF;

    SELECT * INTO v_product FROM product
    WHERE id = (v_item->>'productId')::int FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto con ID % no encontrado', (v_item->>'productId') USING ERRCODE = 'LE404';
    END IF;

    IF v_product.state <> 'Activo' THEN
      RAISE EXCEPTION 'El producto % ya no está disponible', v_product.name USING ERRCODE = 'LE400';
    END IF;

    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto % (ID: %). Disponible: %, Solicitado: %',
        v_product.name, v_product.id, v_product.stock, v_quantity
        USING ERRCODE = 'LE400';
    END IF;

    -- Obtener precio activo actual
    SELECT amount, currency INTO v_price, v_currency FROM price
    WHERE product_id = v_product.id AND is_current = TRUE LIMIT 1;

    IF v_price IS NULL THEN
      RAISE EXCEPTION 'El producto % no tiene un precio activo', v_product.name USING ERRCODE = 'LE400';
    END IF;

    -- El total se suma sin convertir monedas, así que hoy solo se pueden vender productos en pesos
    IF v_currency <> 'ARS' THEN
      RAISE EXCEPTION 'El producto % tiene su precio en %, y por ahora solo se venden productos en pesos (ARS)',
        v_product.name, v_currency
        USING ERRCODE = 'LE400';
    END IF;

    -- Descontar stock e incrementar ventas
    UPDATE product
    SET stock = stock - v_quantity,
        total_sold = total_sold + v_quantity
    WHERE id = v_product.id;

    -- Insertar línea de orden con el precio histórico
    INSERT INTO order_line (order_id, product_id, quantity, price)
    VALUES (v_order_id, v_product.id, v_quantity, v_price);

    v_total := v_total + v_price * v_quantity;
  END LOOP;

  UPDATE "order" SET total_amount = v_total WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. search_path del resto de las funciones SECURITY DEFINER
-- ----------------------------------------------------------------------------
ALTER FUNCTION cancel_order(INTEGER) SET search_path = public, pg_temp;
ALTER FUNCTION is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION current_user_id() SET search_path = public, pg_temp;
