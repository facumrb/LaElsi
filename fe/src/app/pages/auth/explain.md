# 📂 `auth/` — Módulo de Autenticación

## ¿Qué es esta carpeta?

Contiene las **páginas de autenticación**: login y registro. Solo es accesible para usuarios que **no están logueados** (protegido por `guestGuard`).

## Estructura

| Carpeta/Archivo | Propósito |
|---|---|
| `auth.routes.ts` | Define las rutas: `/auth/login` y `/auth/register`. Redirige por defecto a login. |
| `pages/` | Contiene las páginas de login y registro. |

## Subcarpetas de `pages/`

| Carpeta | Página | Descripción |
|---|---|---|
| `login-page/` | Login | Formulario de inicio de sesión con usuario y contraseña. Llama a `AuthService.login()`. |
| `register-page/` | Registro | Formulario de registro de nuevos clientes con datos personales, dirección y credenciales. Llama a `AuthService.register()`. |

## Flujo de autenticación

1. El usuario accede a `/auth/login` o `/auth/register`.
2. Completa el formulario y envía los datos.
3. El backend valida y retorna un JWT (token + refreshToken).
4. `AuthService` guarda la sesión en `localStorage` y actualiza los signals reactivos.
5. El usuario es redirigido según su rol (admin → `/admin`, cliente → `/`).
