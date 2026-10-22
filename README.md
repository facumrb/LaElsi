# LAELSI

La librería “Laelsi” es un negocio dedicado a la venta de productos de librería, juguetería, computación, imprenta digital y sellos. El sitio web contempla ventas, administración y distribución de pedidos desde cualquier parte de Rosario, con el objetivo de ofrecer y expandir los servicios del negocio a más personas.

## Arquitectura

| Capa | Tecnología | Dónde está en el repo |
| --- | --- | --- |
| Frontend | Angular 21 (SPA) desplegado en **Vercel** | `fe/` |
| Autenticación | **Supabase Auth** (usuario/email + contraseña y Google OAuth) | `fe/src/app/services/auth.service.ts` |
| Base de datos | **Supabase** (PostgreSQL con RLS) | `supabase/migrations/` |
| Backend | **Supabase Edge Functions** (TypeScript sobre Deno) | `supabase/functions/` |
| Imágenes | **Cloudflare R2** (subida directa desde el navegador) | `supabase/functions/_shared/r2.ts` |
| Correos | **Resend** (enlace para recuperar la contraseña) | `supabase/functions/_shared/correo.ts` |
| Anti-bots | **Cloudflare Turnstile** en el checkout y en "Recuperar contraseña" | `fe/src/app/shared/components/turnstile/` |

El navegador habla con dos servicios: las Edge Functions (toda la lógica de negocio) y Cloudflare R2 (solo para subir y mostrar imágenes). Resend nunca se llama desde el navegador: los correos los envían las Edge Functions. La carpeta `be/` contiene el backend Express anterior, que ya no se usa (ver [Backend anterior](#backend-anterior-be)).

## Requisitos previos

Antes de abrir el proyecto, asegúrate de tener instalados:

- **Node.js**: Versión 22 (LTS) o superior.
- **NPM**: Versión 10 o superior.
- **Angular CLI**: Versión 21 o superior.

La CLI de Supabase y Wrangler (Cloudflare) no hace falta instalarlas: se ejecutan con `npx`.

## Pasos de instalación en Windows

Si no tienes Node.js instalado, recomendamos usar **fnm** (Fast Node Manager) para gestionar las versiones:

1.  **Instalar fnm:**
    ```powershell
    winget install Schniz.fnm
    ```
2.  **Instalar Node.js v22 y configurar PowerShell:**

    ```bash
    fnm install 22
    fnm use 22

    # Configurar el perfil para que fnm cargue siempre:
    notepad $profile
    ```

    _Agrega la siguiente línea al final del archivo que se abrió y guarda:_

    ```powershell
    fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
    ```

3.  **Instalar Angular CLI:**
    ```bash
    npm install -g @angular/cli@latest
    ```

## Cómo abrir el proyecto

Para abrir el proyecto, sigue estos pasos:

**1. Clona este repositorio:**

```bash
git clone https://github.com/facumrb/LaElsi.git
```

**2. Instala las dependencias:**

Ejecuta este comando en la carpeta raíz:

```bash
npm install
```

**3. Configuración del frontend:**

Completá `fe/src/environments/environment.development.ts` (desarrollo) y `fe/src/environments/environment.ts` (producción) con los datos de tu proyecto. Todos son valores públicos:

| Campo | Dónde se consigue |
| --- | --- |
| `supabaseUrl` | Supabase → Project Settings → API → Project URL |
| `supabaseAnonKey` | Supabase → Project Settings → API → anon public |
| `productImagesUrl` | Cloudflare R2 → bucket `laelsi-products` → Public URL (con `/` final) |
| `userImagesUrl` | Cloudflare R2 → bucket `laelsi-users` → Public URL (con `/` final) |
| `turnstileSiteKey` | Cloudflare → Turnstile → Site Key (vacío = sin verificación) |

**4. Ejecución del proyecto:**

```bash
npm run start:dev
```

El frontend queda en `http://localhost:4200` y usa las Edge Functions del proyecto de Supabase configurado. Ya no hace falta levantar un backend local ni tener MySQL.

## Puesta en marcha de la infraestructura

Esto se hace **una sola vez**, al crear el entorno.

### 1. Supabase

1. Crear el proyecto en [supabase.com](https://supabase.com/) (región recomendada: `sa-east-1`).
2. **Authentication → Sign In / Providers → Google**: habilitarlo con el Client ID y el Client Secret de Google Cloud Console. La _Callback URL_ a registrar en Google es `https://<project-ref>.supabase.co/auth/v1/callback`.
3. **Authentication → URL Configuration**:
   - _Site URL_: la URL del sitio en producción.
   - _Redirect URLs_: `http://localhost:4200/**` y `https://tu-dominio.com/**`. Sin esto, el login con Google vuelve con error.

### 2. Cloudflare R2 y Turnstile

1. Crear los buckets `laelsi-products` y `laelsi-users` y habilitarles el acceso público.
2. En **cada bucket → Settings → CORS Policy**, permitir la subida desde el sitio:

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:4200", "https://tu-dominio.com"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type", "cache-control"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

3. Crear un API Token de R2 con permiso de lectura y escritura sobre los dos buckets.
4. Crear un widget de Turnstile para el dominio del sitio.

### 3. Resend (correos de recuperación de contraseña)

[Resend](https://resend.com/) envía el correo con el enlace de "¿Olvidaste tu contraseña?" y el aviso de que la contraseña se cambió. El plan gratuito alcanza para este uso: 3.000 correos por mes, con un tope de 100 por día.

**No hay que tocar código para conectar la cuenta.** Los datos de Resend van como _secrets_ de las Edge Functions (paso 4).

1. Crear la cuenta en [resend.com](https://resend.com/).
2. **Domains → Add Domain**: agregar un dominio propio. Resend recomienda usar un subdominio (por ejemplo `correo.tu-dominio.com`) para no mezclar la reputación de los envíos con la del dominio principal.
3. Cargar en el proveedor de DNS del dominio los registros que muestra Resend y esperar a que el dominio figure como **Verified**.
4. **API Keys → Create API Key** con permiso _Sending access_. La clave empieza con `re_` y se muestra una sola vez.
5. Completar en `supabase/functions/.env`:

   | Variable | Qué poner |
   | --- | --- |
   | `RESEND_API_KEY` | La clave del paso 4 |
   | `RESEND_FROM` | El remitente, con el formato `Laelsi <no-reply@correo.tu-dominio.com>`. El dominio tiene que ser **exactamente** el verificado |
   | `SITE_URL` | La URL pública del sitio, sin barra final. Con ella se arma el enlace del correo |

**Sin dominio propio** (los dominios `*.vercel.app` no se pueden verificar) solo se puede probar: con `RESEND_FROM="Laelsi <onboarding@resend.dev>"` Resend entrega los correos únicamente a la casilla con la que creaste la cuenta, y rechaza cualquier otro destinatario.

Qué se puede ajustar y dónde:

| Qué | Archivo |
| --- | --- |
| Textos y diseño de los correos | `supabase/functions/_shared/correo-plantillas.ts` |
| Vigencia del enlace (60 min) y límites de envío | constantes al inicio de la sección "Recuperación de contraseña" en `supabase/functions/auth/index.ts` |
| Número de WhatsApp de ayuda | `fe/src/app/pages/auth/pages/recover-password-page/recover-password-page.component.ts` |

### 4. Variables secretas

Estas claves dan acceso total a los datos: no van en el frontend ni en Vercel, y los archivos que las contienen no se suben al repositorio (están cubiertos por `.gitignore`).

**`supabase/functions/.env`** — secrets de las Edge Functions:

```bash
# Cloudflare R2 (R2 → Manage API Tokens)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PRODUCTS=laelsi-products
R2_BUCKET_USERS=laelsi-users

# Cloudflare Turnstile (clave PRIVADA). Vacía = no se exige la verificación anti-bots.
TURNSTILE_SECRET_KEY=

# Resend (API Keys → Create API Key). Sin estas dos, "Recuperar contraseña" responde con error.
RESEND_API_KEY=
RESEND_FROM="Laelsi <no-reply@correo.tu-dominio.com>"

# URL pública del sitio, sin barra final. Es el destino de los enlaces que van por email.
SITE_URL=https://tu-dominio.com

# Orígenes que pueden llamar a las funciones, separados por coma.
# http://localhost:4200 y los dominios *.vercel.app ya están permitidos.
ALLOWED_ORIGINS=https://tu-dominio.com

# Descuento máximo (en %) permitido en los cambios masivos de precio
MAX_BULK_DISCOUNT_PERCENTAGE=90

# Email del comercio que recibe el aviso cuando alguien usa el Botón de arrepentimiento (Res. 424/2020).
# Sin esto la solicitud igual se guarda (tabla revocation_request), pero nadie se entera por correo.
REVOCATION_NOTIFY_EMAIL=
```

**`supabase/.env`** — solo para los scripts de seed:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# Email REAL del administrador principal: recibe el correo de "Recuperar contraseña".
# No se versiona en el repositorio a propósito.
SEED_ADMIN_EMAIL=
# Contraseña del administrador principal. Mínimo 12 caracteres.
SEED_ADMIN_PASSWORD=
# Contraseña de los usuarios de prueba (mínimo 12 caracteres y distinta de la del administrador).
# Solo hace falta con "npm run seed:demo".
SEED_DEMO_PASSWORD=
# Confirmación para cargar los datos de demostración. Poné "yes" SOLO en un proyecto de pruebas:
# en producción dejala vacía, así "npm run seed:demo" se niega a correr.
SEED_ALLOW_DEMO=
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_DB_URL` no se cargan como secrets: Supabase las inyecta sola en las funciones desplegadas.

### 5. Base de datos, funciones y datos iniciales

Desde la raíz del repo:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>

# 1. Crear tablas, trigger de Auth, funciones SQL y políticas RLS
npm run db:push

# 2. Cargar los secrets y desplegar las Edge Functions
npm run functions:secrets
npm run functions:deploy

# 3. Subir las imágenes de be/uploads a R2
npx wrangler login
npm run r2:subir-imagenes

# 4. Cargar los datos iniciales
npm run seed          # administrador principal + categorías + productos
npm run seed:demo     # además: usuarios, productos y órdenes de prueba (solo en un proyecto de pruebas: exige SEED_ALLOW_DEMO=yes)
```

Si preferís no usar la CLI para la base, los archivos de `supabase/migrations/` se pueden pegar en el SQL Editor de Supabase, **en orden numérico**.

Cada vez que se agrega una migración o cambia un secret hay que repetir el paso que corresponda: `npm run db:push` aplica solo las migraciones nuevas, y `npm run functions:secrets` + `npm run functions:deploy` actualizan las funciones.

### 6. Vercel

1. Importar el repositorio y elegir `fe` como **Root Directory** (framework: Angular).
2. No hacen falta variables de entorno: la configuración pública está en `fe/src/environments/environment.ts`.
3. `fe/vercel.json` ya define el _rewrite_ de la SPA y las cabeceras de seguridad.

## Seguridad

- **Las escrituras pasan siempre por las Edge Functions**, que validan la sesión y el rol antes de tocar datos. Las políticas RLS son la segunda barrera: con la clave pública solo se puede _leer_ lo que corresponde a cada usuario.
- **Las contraseñas las guarda Supabase Auth**, nunca nuestras tablas. El rol (Admin / Client) vive en la tabla `user` y solo lo puede asignar el backend.
- **Las imágenes se suben con URLs prefirmadas** que vencen a los 5 minutos y solo aceptan WebP. El nombre del archivo lo decide el servidor.
- **Límite de intentos de login**: 5 intentos fallidos por IP cada 15 minutos. La IP sale de `CF-Connecting-IP` o, si no está, del último valor de `X-Forwarded-For`, nunca del primero, que controla el navegador. Un login correcto no reinicia el contador.
- **Validación en vivo de los formularios** (`check_field_unique`, que el navegador llama directo a la API REST): 30 consultas por minuto por IP.
- **Listados completos de productos y categorías** (con inactivos, stock y ventas): solo para administradores. La tienda usa los endpoints de productos activos.
- **Recuperación de contraseña**:
  - La respuesta es siempre la misma, exista o no la cuenta: no se puede usar para averiguar qué emails están registrados.
  - El enlace vence a la hora, sirve una sola vez y queda anulado si se pide otro. En la base se guarda su hash, no el enlace.
  - El destino del enlace sale de `SITE_URL`, nunca de un dato que envíe el navegador.
  - Límites: 3 correos por hora por cuenta y 5 solicitudes cada 15 minutos por IP, más Turnstile si está configurado. Protegen la cuota de Resend.
- **Botón de arrepentimiento** (`POST /revocations`, público por exigencia de la norma): Turnstile, tope de 5 solicitudes por hora por IP y validación de todos los campos en el servidor. Los textos que escribe la persona se escapan antes de ir en el correo al comercio.
- **Pantallas de acceso**: si la persona sale y vuelve, se conserva el usuario o email que había escrito (en `sessionStorage`, hasta cerrar la pestaña). La contraseña nunca se guarda: la completa el navegador o el gestor de contraseñas.
- **Cambiar el email o la contraseña de la propia cuenta exige la contraseña actual**, verificada en el servidor (`PATCH /clients/:id` y `PATCH /admins/:id`). Con solo el token de sesión (por ejemplo, robado con un XSS) no alcanza para quedarse con la cuenta. Un administrador que edita a otra persona no la necesita, y las cuentas de solo Google (sin contraseña) tampoco. Los intentos fallidos cuentan para el mismo límite de login, que ahora también protege `verify-password`.
- **Las contraseñas se leen tal cual llegan**: el servidor ya no les recorta los espacios ni colapsa los repetidos. Las cuentas anteriores se guardaron normalizadas, así que el login prueba también esa versión (`_shared/contrasenas.ts`).
- **Turnstile falla cerrado en producción**: si falta `TURNSTILE_SECRET_KEY`, el checkout, el registro, la recuperación de contraseña y el botón de arrepentimiento responden 500 en vez de omitir la verificación. Solo se omite en el stack local de Supabase (`http://`). El registro público ahora también lleva Turnstile y un tope de 10 registros por hora por IP.
- **Una orden o una foto ajena responden igual que una inexistente (404)**, y sin sesión siempre es 401: los IDs son secuenciales y la respuesta no sirve para averiguar cuáles existen.
- **El trigger de alta de cuentas** (`handle_new_auth_user`) solo vincula por email un perfil existente si el email de la cuenta nueva está confirmado y el perfil no tiene ya otra cuenta. `create_order` rechaza productos con precio fuera de ARS, y todas las funciones `SECURITY DEFINER` fijan `search_path = public, pg_temp`.
- **Content-Security-Policy en modo solo reporte** (`fe/vercel.json`): no bloquea nada todavía. Mirá la consola del navegador durante un tiempo y, cuando no aparezcan violaciones legítimas, cambiá la cabecera a `Content-Security-Policy` para que se aplique.
- **Las reglas de WAF de Cloudflare protegen el sitio, no la API**: las Edge Functions se sirven desde `*.supabase.co`, que no pasa por tu zona de Cloudflare. La protección de la API es la de arriba (validaciones, Turnstile y límite de login).

## Textos legales y verificación de Google

La Política de Privacidad y los Términos y Condiciones son rutas públicas de la SPA:

| Ruta | Contenido | Código |
| --- | --- | --- |
| `/privacidad` | Política de Privacidad (incluye la sección sobre los datos de Google) | `fe/src/app/pages/client/pages/footer-pages/privacy-page/` |
| `/terminos` | Términos y Condiciones | `fe/src/app/pages/client/pages/footer-pages/terms-page/` |
| `/arrepentimiento` | Botón de arrepentimiento (Res. 424/2020) | `fe/src/app/pages/client/pages/revocation-page/` y Edge Function `revocations` |

- Los datos que comparten las páginas (domicilio, WhatsApp, titular, CUIT, email de contacto) y la **versión** de los textos están en `footer-pages/legal-info.ts`. Los campos opcionales no se muestran mientras estén vacíos.
- **Los textos describen lo que el código hace hoy** (qué datos se piden, quién los recibe, cuánto se guardan, cómo se compra). Si cambia algo de eso (un proveedor nuevo, un dato nuevo en el perfil, analítica, pagos en línea, envíos a domicilio), hay que actualizar el texto **y** `LEGAL_VERSION` en `legal-info.ts`. Esa versión se guarda con la aceptación de cada persona que se registra (`user.terms_accepted_at` y `user.terms_version`).
- **Aceptación al registrarse:** casilla obligatoria que el servidor vuelve a exigir (`POST /auth/register` responde 400 sin ella).
- **Aceptación con Google:** la cuenta se crea al volver de Google, sin casilla. Por eso, mientras una cuenta de cliente tenga `termsAccepted = false` (cuentas de Google y cuentas anteriores a la casilla), el layout de la tienda muestra un diálogo bloqueante (`terms-gate`) con una casilla explícita. Al aceptar, `POST /auth/accept-terms` guarda la fecha y la versión en `user.terms_accepted_at` y `user.terms_version`. Las cuentas de administración no pasan por acá.
- **Botón de arrepentimiento:** está en el inicio (banner), en el pie de página y en el marco de las páginas legales. No pide cuenta: guarda la solicitud en `revocation_request`, devuelve un código de identificación (`ARR-000123`) que se muestra al instante y se envía por email, y avisa al comercio a `REVOCATION_NOTIFY_EMAIL`. Protegido con Turnstile y un tope de 5 solicitudes por hora por IP. **Todavía no hay una pantalla de administración para estas solicitudes:** se gestionan desde el email de aviso y la tabla.
- Enlaces a las páginas legales: pie de página, casilla del registro y aviso bajo "Continuar con Google". El `index.html` repite los dos enlaces dentro de un `<noscript>`.

### Pre-renderizado de las dos páginas legales

El sitio es una SPA: el HTML que baja el navegador está vacío y el texto aparece al ejecutar JavaScript. Para que los robots que no ejecutan JavaScript (como los que verifica Google) vean el texto, `/privacidad` y `/terminos` se **pre-renderizan en el build** (`outputMode: "static"` en `fe/angular.json`). El resto del sitio sigue siendo una SPA.

- Qué rutas se pre-renderizan: `fe/src/app/app.routes.server.ts`. El build genera `privacidad/index.html` y `terminos/index.html`, y el resto de las rutas usa `index.csr.html` (**ya no existe `index.html`**; por eso `fe/vercel.json` apunta ahí).
- Las páginas legales viven **fuera del layout de la tienda** (`app.routes.ts`) y usan su propio marco liviano (`legal-shell`). El navbar de la tienda depende de `localStorage` y del API, que no existen en el build. **Regla:** nada de lo que usen estas páginas puede depender del navegador (`localStorage`, `window`, `HttpClient`, `AuthService`, `CartService`); si hace falta, va dentro de `afterNextRender`. Un test lo vigila (`legal-pages.spec.ts`).
- Verificarlo sin buildear: `npm run start:dev` y abrir `http://localhost:4200/privacidad` → _Ver código fuente de la página_ tiene que mostrar el texto de la política (y `ng-server-context="ssg"`).
- Verificarlo después de un build (`cd fe && npx ng build`): tienen que existir `dist/frontend/browser/privacidad/index.html`, `terminos/index.html` e `index.csr.html`.

### Google Cloud → Google Auth Platform

Antes llamada "Pantalla de consentimiento de OAuth". El dominio principal es `https://laelsi.com.ar` (sin `www`); `www.laelsi.com.ar` es solo un alias que tiene que **redirigir al principal** (Vercel → Project → Settings → Domains). Usá las URLs finales, sin redirecciones.

| Campo | Valor |
| --- | --- |
| Página principal de la aplicación | `https://laelsi.com.ar` |
| Vínculo a la política de privacidad | `https://laelsi.com.ar/privacidad` |
| Vínculo a las condiciones del servicio | `https://laelsi.com.ar/terminos` |
| Dominios autorizados | `laelsi.com.ar` |
| Orígenes de JavaScript autorizados (cliente OAuth) | `https://laelsi.com.ar` y `https://www.laelsi.com.ar` |

- El dominio tiene que estar verificado en Google Search Console con la misma cuenta propietaria del proyecto de Google Cloud.
- Los permisos solicitados deben ser solo los básicos (`openid`, `email`, `profile`), que es lo que pide Supabase. Si se agrega otro, hay que ampliar la sección 4 de la política.
- Los dos enlaces tienen que responder `200` en producción antes de enviar la solicitud de verificación. En PowerShell usá `curl.exe -I https://laelsi.com.ar/privacidad` (`curl` a secas es un alias de otro comando). Tiene que responder `200` directo, **sin** `308`.
- Mientras `www` siga activo como alias, su origen también tiene que figurar en `ALLOWED_ORIGINS`, en las _Redirect URLs_ de Supabase, en el CORS de los buckets de R2 y en los hostnames de Turnstile. Detalle de qué cargar en cada servicio: `docs/cierre-revision-seguridad-y-datos-definitivos-2026-10-22.md`.

## Backend anterior (`be/`)

La carpeta `be/` conserva el backend Express + MikroORM + MySQL. Ya no forma parte de la aplicación, pero se mantiene hasta confirmar que todo funciona en la nueva arquitectura, porque:

- `be/uploads/` es el origen de las imágenes que sube `npm run r2:subir-imagenes`.
- `be/src/` sirve de referencia: cada Edge Function indica en su encabezado a qué archivos reemplaza.

En `be/` no hay credenciales versionadas: el seed (`be/src/shared/db/seed.ts`), los archivos `.http` y los scripts de `be/tests/` leen la contraseña de los usuarios de prueba de la variable de entorno `SEED_PASSWORD` (mínimo 12 caracteres; va en `be/.env`, que git ignora).

Cuando ya no haga falta, se puede archivar en una rama (`legacy/express-backend`) y quitar `"be"` de `workspaces` en el `package.json` raíz.
