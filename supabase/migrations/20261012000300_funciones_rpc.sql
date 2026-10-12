-- ============================================================================
-- LaElsi — Tarea 1.3: Funciones RPC de validación y transacciones atómicas
-- ============================================================================
-- Convención de errores: las funciones lanzan excepciones con un SQLSTATE propio
-- que la Edge Function traduce a un código HTTP:
--   LE400 -> 400 (dato inválido o regla de negocio)
--   LE404 -> 404 (recurso inexistente)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Verificación de unicidad de campos (reemplaza a GET /api/validate-unique)
-- ----------------------------------------------------------------------------
-- La usan los formularios para avisar, mientras se escribe, si un valor ya está
-- tomado. Devuelve { available, message }, el mismo formato que el backend anterior.
-- Es pública (la necesita el formulario de registro), así que solo admite una
-- lista cerrada de entidades y campos.
CREATE OR REPLACE FUNCTION check_field_unique(
  p_entity     TEXT,
  p_field      TEXT,
  p_value      TEXT,
  p_exclude_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value     TEXT := TRIM(COALESCE(p_value, ''));
  v_exists    BOOLEAN;
  v_sensitive BOOLEAN := p_field IN ('email', 'username', 'dni', 'cuit');
BEGIN
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

REVOKE ALL ON FUNCTION check_field_unique(TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_field_unique(TEXT, TEXT, TEXT, INTEGER) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Transacción atómica: creación de orden y reserva de stock
-- ----------------------------------------------------------------------------
-- Reproduce OrderService.createOrder. El bloqueo FOR UPDATE evita que dos compras
-- simultáneas vendan el mismo stock; los productos se bloquean ordenados por ID
-- para que dos órdenes cruzadas no puedan provocar un deadlock.
--
-- NO se puede llamar desde el navegador: solo la ejecuta la Edge Function "orders"
-- (service role), que antes valida la sesión, los datos y el token de Turnstile.
-- Si fuera pública, un bot podría saltearse Turnstile llamándola directamente.
CREATE OR REPLACE FUNCTION create_order(
  p_client_id       INTEGER,
  p_delivery_method delivery_method,
  p_payment_method  payment_method,
  p_items           JSONB -- Array de [{ "productId": 1, "quantity": 2 }]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id INTEGER;
  v_item     JSONB;
  v_product  product%ROWTYPE;
  v_quantity INTEGER;
  v_price    NUMERIC;
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
    SELECT amount INTO v_price FROM price
    WHERE product_id = v_product.id AND is_current = TRUE LIMIT 1;

    IF v_price IS NULL THEN
      RAISE EXCEPTION 'El producto % no tiene un precio activo', v_product.name USING ERRCODE = 'LE400';
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

REVOKE ALL ON FUNCTION create_order(INTEGER, delivery_method, payment_method, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_order(INTEGER, delivery_method, payment_method, JSONB) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Transacción atómica: cancelación de orden y restauración de stock
-- ----------------------------------------------------------------------------
-- Reproduce OrderService.cancelOrder, respetando la máquina de estados:
--   * Envío:  se puede cancelar en Pendiente, Pagado o Enviado.
--   * Retiro: se puede cancelar en Pendiente o Pagado.
-- Quién puede cancelar (el dueño o un administrador) lo valida la Edge Function.
CREATE OR REPLACE FUNCTION cancel_order(p_order_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order "order"%ROWTYPE;
  v_line  RECORD;
  v_can_cancel BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM "order" WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada' USING ERRCODE = 'LE404';
  END IF;

  IF v_order.status = 'Cancelado' THEN
    RAISE EXCEPTION 'La orden ya se encuentra cancelada' USING ERRCODE = 'LE400';
  END IF;

  v_can_cancel := CASE
    WHEN v_order.delivery_method = 'Envío' THEN v_order.status IN ('Pendiente', 'Pagado', 'Enviado')
    ELSE v_order.status IN ('Pendiente', 'Pagado')
  END;

  IF NOT v_can_cancel THEN
    RAISE EXCEPTION 'No se puede cambiar el estado de "%" a "Cancelado" para una orden de tipo "%". Transiciones válidas: ninguna (estado final)',
      v_order.status, v_order.delivery_method
      USING ERRCODE = 'LE400';
  END IF;

  -- Restaurar el stock de cada producto (bloqueando en orden de ID)
  FOR v_line IN
    SELECT product_id, quantity FROM order_line WHERE order_id = p_order_id ORDER BY product_id
  LOOP
    UPDATE product
    SET stock = stock + v_line.quantity,
        total_sold = GREATEST(0, total_sold - v_line.quantity)
    WHERE id = v_line.product_id;
  END LOOP;

  UPDATE "order" SET status = 'Cancelado' WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION cancel_order(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_order(INTEGER) TO service_role;
