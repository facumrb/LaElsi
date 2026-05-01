# 📂 `guards/` — Protección de Rutas

## ¿Qué es esta carpeta?

Contiene los **route guards** de Angular. Son funciones que se ejecutan **antes** de cargar una ruta y deciden si el usuario tiene permiso para acceder o si debe ser redirigido.

## Archivos

| Guard | Protege | Lógica |
|---|---|---|
| `admin.guard.ts` | Rutas `/admin/*` | Solo permite acceso si el usuario está logueado **Y** tiene rol `Admin`. Si no, redirige a `/`. |
| `auth.guard.ts` | Rutas que requieren autenticación genérica | Verifica que el usuario esté logueado (cualquier rol). |
| `client.guard.ts` | Rutas como `/profile` | Verifica que el usuario esté logueado como `Client`. Si no está logueado, redirige al login. |
| `guest.guard.ts` | Rutas `/auth/*` (login, registro) | Solo permite acceso si el usuario **NO** está logueado. Evita que un usuario ya autenticado vuelva al login. |

## ¿Cómo se usan?

Se asignan en las rutas con `canActivate`:
```typescript
{ path: 'admin', canActivate: [adminGuard], loadChildren: ... }
```

## Dependencia clave

Todos los guards dependen de `AuthService` para verificar el estado de sesión (`isLoggedIn()`, `isAdmin()`).
