# Páginas legales, aceptación de términos, botón de arrepentimiento y pre-renderizado

Fecha: 2026-10-21 · Rama: `main` · Estado: **sin commit y sin `ng build`**. Nada aplicado en producción.

Para qué: verificar el OAuth de Google (que exige una política de privacidad propia, enlazada desde el inicio y legible) y dejar el comercio en regla con la normativa de comercio electrónico de Argentina.

## Orden de despliegue (importante)

1. `npm run db:push` — aplica `20261022000100_aceptacion_terminos_y_arrepentimiento.sql` (columnas `terms_*` en `user` y tabla `revocation_request`). Tiene que ir **antes** de las funciones: `POST /auth/register` ya escribe las columnas nuevas.
2. Agregar `REVOCATION_NOTIFY_EMAIL=<email del comercio>` en `supabase/functions/.env` y correr `npm run functions:secrets`. Sin eso el botón de arrepentimiento funciona y guarda la solicitud, pero nadie recibe el aviso por correo.
3. `npm run functions:deploy` — despliega la función nueva `revocations` y `auth` modificada.
4. Frontend (Vercel). **El build ahora pre-renderiza dos rutas**: mirá que termine bien (ver "Qué no se pudo verificar").

Entre los pasos 3 y 4 el frontend viejo no manda la casilla de aceptación y `POST /auth/register` responde `400` con un mensaje que pide recargar. Hacelos seguidos. El orden inverso (frontend primero) no rompe el registro, pero el botón de arrepentimiento no andaría hasta desplegar las funciones.

## Qué se hizo

| Tema | Qué | Dónde |
| --- | --- | --- |
| Páginas legales | `/privacidad` y `/terminos`, pre-renderizadas, con marco propio | `fe/src/app/pages/client/pages/footer-pages/` |
| Datos legales | Titular, CUIT, email, versión de los textos | `footer-pages/legal-info.ts` |
| Aceptación | Casilla obligatoria en el registro; el servidor la exige y guarda fecha y versión | `register-page.*`, `auth/index.ts`, `_shared/usuarios.ts` |
| Arrepentimiento | Página `/arrepentimiento`, banner en el inicio, enlace en el pie, función `revocations`, tabla `revocation_request`, correos | `revocation-page/`, `supabase/functions/revocations/` |
| Coherencia | FAQ y "¿Quiénes somos?" ya no prometen envíos nacionales, cobro online ni email de confirmación | `faq-page`, `about-us-page` |
| Pre-renderizado | `outputMode: "static"` + `server`; solo las dos páginas legales | `angular.json`, `main.server.ts`, `app.config.server.ts`, `app.routes.server.ts` |
| Hosting | Rewrites a `index.csr.html` (ya no existe `index.html`) y a las páginas pre-renderizadas | `fe/vercel.json`, `fe/ngsw-config.json` |
| Dependencias | `@angular/ssr` y `@angular/platform-server` 21.2.21; el resto de Angular quedó fijado en `^21.2.21` | `fe/package.json`, `package-lock.json` |

## Cómo verificar

**Ya verificado (2026-10-21):**

- `cd fe && npx ng test --no-watch` → 12 archivos, 72 tests en verde (30 previos + 42 nuevos).
- Servidor de desarrollo (`ng serve`): `/privacidad` y `/terminos` devuelven el texto completo en el HTML (`ng-server-context="ssg"`, título, `h1`/`h2`, leyendas); `/`, `/search` y `/arrepentimiento` siguen devolviendo el shell vacío de la SPA.
- Migración aplicada sobre Postgres (PGlite): idempotente, restricciones y límite por IP correctos, rollback correcto.
- Lógica de `revocations` (37 comprobaciones) y de `createUser`/`assertTermsAccepted` (17), ejecutando el código real con dobles de base, Turnstile y Resend. `tsc --strict` sobre las funciones tocadas, sin errores.

**Después de desplegar:**

1. Páginas legales (en PowerShell hay que escribir `curl.exe`, porque `curl` es un alias de `Invoke-WebRequest`):

   ```powershell
   curl.exe -I https://www.laelsi.com.ar/privacidad          # HTTP 200
   curl.exe -s https://www.laelsi.com.ar/privacidad | findstr "Política"
   curl.exe -I https://www.laelsi.com.ar/terminos
   ```

   La segunda tiene que mostrar texto de la política: eso prueba que el HTML ya no está vacío.
2. Registro: sin tildar la casilla el botón "Crear Cuenta" no se habilita. Después de registrar una cuenta:

   ```sql
   select username, terms_accepted_at, terms_version from "user" order by id desc limit 3;
   ```

3. Arrepentimiento: enviar una solicitud en `/arrepentimiento`. Tiene que mostrar el código `ARR-0000NN` al instante, llegar la constancia al email de la persona y el aviso a `REVOCATION_NOTIFY_EMAIL`, y quedar en `select * from revocation_request order by id desc limit 1;`. La sexta solicitud en una hora desde la misma IP responde `429`.
4. Permisos de la tabla nueva (esperado: ninguna fila):

   ```sql
   select grantee, privilege_type from information_schema.role_table_grants
   where table_name = 'revocation_request' and grantee in ('anon', 'authenticated');
   ```

5. Google Cloud: cargar las URLs de la tabla del README y enviar la verificación.

## Qué no se pudo verificar

- **`ng build` de producción.** La regla del proyecto es no buildear, así que el paso real de pre-renderizado en Node/Vercel no se ejecutó. Lo más cercano que se probó fue el renderizado en el servidor de desarrollo, que usa el mismo código de la app. Antes de confiar en el deploy, corré `cd fe && npx ng build` y comprobá que existan `dist/frontend/browser/privacidad/index.html`, `terminos/index.html` e `index.csr.html`, y que **no** exista `index.html`.
  Si el build falla en Vercel, el sitio queda en el deploy anterior (no se cae). Para volver atrás: quitar `"server"` y `"outputMode"` de `fe/angular.json`, y en `fe/vercel.json` apuntar el rewrite final a `/index.html` y borrar los dos rewrites de `privacidad` y `terminos`.
- **El envío real de correos** (Resend) y el widget de Turnstile en `/arrepentimiento`: solo se probaron con dobles.
- **El comportamiento de Vercel** con los rewrites a `privacidad/index.html`. Está pensado para que funcione con y sin trailing slash, pero se confirma con el `curl.exe` de arriba.

## Hallazgo: `laelsi.com.ar` redirige a `www.laelsi.com.ar`

`curl.exe -I https://laelsi.com.ar/privacidad` responde `308` con `Location: https://www.laelsi.com.ar/privacidad` (verificado el 2026-10-21). Entonces el dominio principal del sitio es `www`. Esto no se puede confirmar desde el repo (no se puede leer `supabase/functions/.env`), pero hay que revisarlo, porque la documentación de configuración usa el dominio sin `www`:

| Dónde | Qué comprobar |
| --- | --- |
| Secret `ALLOWED_ORIGINS` | Tiene que incluir `https://www.laelsi.com.ar`. Si no, el navegador bloquea (CORS) **todas** las llamadas a las Edge Functions desde ese origen |
| Secret `SITE_URL` | Los enlaces de los correos de recuperación usan este valor. Conviene que apunte al dominio final |
| Supabase → Authentication → URL Configuration | _Redirect URLs_ con `https://www.laelsi.com.ar/**`; si no, el login con Google vuelve con error |
| Cloudflare R2 → CORS de los dos buckets | `AllowedOrigins` con `https://www.laelsi.com.ar`, o la subida de imágenes falla |
| Cloudflare Turnstile | El hostname del widget tiene que cubrir `www` |
| Google Cloud → Google Auth Platform | Cargar las URLs finales (`https://www.laelsi.com.ar/...`), sin redirecciones |

Si ya estaba resuelto, no hay nada que hacer.

## Pendiente y decisiones

1. **Pantalla de administración para las solicitudes de arrepentimiento.** Hoy se gestionan desde el email de aviso y la tabla `revocation_request` (la columna `resolved_at` queda para que el comercio marque las resueltas). Es la mejora más útil que sigue.
2. **Constancia de aceptación con Google.** Quien entra con Google no tilda ninguna casilla: solo hay un aviso bajo el botón y no queda registro. Cerrarlo requiere una pantalla de aceptación en el primer ingreso.
3. **El Botón de arrepentimiento solo está donde pide la norma** (inicio) más el pie y las páginas legales. No está en "Mis Pedidos" ni en el carrito; se puede agregar.
4. **Revisión profesional.** Los textos son una base adaptada al proyecto, no asesoramiento legal. Conviene que los revise un abogado, sobre todo la transferencia internacional de datos, y consultar si corresponde inscribir la base en el Registro Nacional de Bases de Datos de la AAIP.
5. Las políticas del negocio que quedaron escritas en los Términos (causas de cancelación por parte del comercio, devolución del importe por el mismo medio, "plazo razonable" para pagar o retirar) hay que confirmarlas con la librería.
