-- ============================================================================
-- LaElsi — Tarea 1.2: Sincronización de Supabase Auth con public."user"
-- ============================================================================
-- Cada alta en auth.users (registro con email/contraseña, Google OAuth o alta
-- hecha por un administrador) crea o vincula su perfil en public."user".
--
-- SEGURIDAD: el rol se lee SOLO de raw_app_meta_data, que únicamente puede
-- escribir el backend con la service role. raw_user_meta_data lo controla el
-- propio usuario al registrarse, así que usarlo para el rol permitiría que
-- cualquiera se registre como administrador.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Si ya existía un perfil con ese email (por ejemplo, creado por el seed),
  -- se lo vincula a la cuenta de Auth en lugar de duplicarlo.
  INSERT INTO public."user" (supabase_uid, role, email, name, last_name, username)
  VALUES (NEW.id, v_role, NEW.email, left(v_name, 100), left(COALESCE(v_last_name, ''), 100), v_username)
  ON CONFLICT (lower(email)) DO UPDATE
    SET supabase_uid = EXCLUDED.supabase_uid;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
