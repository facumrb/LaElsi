# 📂 `interceptors/` — Interceptores HTTP

## ¿Qué es esta carpeta?

Contiene **interceptores HTTP funcionales** de Angular. Se ejecutan automáticamente en **cada petición HTTP** que sale de la app, permitiendo modificar requests y manejar responses de forma centralizada.

## Archivos

| Interceptor | Función |
|---|---|
| `auth.interceptor.ts` | **Inyecta el token JWT** en el header `Authorization: Bearer <token>` de cada petición HTTP. Si no hay token, la petición pasa sin modificar. |
| `error.interceptor.ts` | **Maneja errores HTTP globalmente**. Si recibe un `401` (no autorizado), intenta refrescar el token automáticamente y reintentar la petición. Si el refresh falla, hace logout. Para otros errores, delega al `ApiErrorService` que muestra alertas al usuario. |

## Flujo de una petición

```
Componente → HttpClient → [authInterceptor] → [errorInterceptor] → Backend
                                                       ↓
                                              Si 401 → refreshToken()
                                              Si falla → logout()
```

## ¿Dónde se registran?

En `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

## Importancia

Son fundamentales para la **seguridad** y la **experiencia de usuario**: el usuario nunca tiene que preocuparse por tokens expirados ni por manejar errores HTTP manualmente en cada componente.
