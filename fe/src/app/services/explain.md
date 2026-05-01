# 📂 `services/` — Servicios de la Aplicación

## ¿Qué es esta carpeta?

Contiene los **servicios inyectables** de Angular (`@Injectable`). Son clases singleton que encapsulan la lógica de negocio, el estado de la aplicación y la comunicación con la API del backend.

## Archivos (servicios de estado/lógica)

| Servicio | Responsabilidad |
|---|---|
| `auth.service.ts` | **Autenticación completa**: login, registro, logout, manejo de tokens JWT (access + refresh), persistencia de sesión en `localStorage`, detección de token expirado, y señales reactivas (`currentUser`, `isLoggedIn`, `isAdmin`). |
| `cart.service.ts` | **Carrito de compras**: agregar, actualizar, eliminar productos. Persiste en `localStorage`. Usa **signals** para reactividad (`items`, `totalItems`, `totalAmount`). |
| `alert.service.ts` | **Notificaciones y alertas**: wrapper sobre SweetAlert2 para toasts, modales, confirmaciones de eliminación y confirmaciones de acciones. Centraliza toda la UI de feedback al usuario. |
| `navigation-history.service.ts` | **Historial de navegación**: registra las URLs visitadas para que el botón "Volver" funcione correctamente dentro de la SPA. |
| `product-draft.service.ts` | **Borrador de producto**: almacena temporalmente el estado de un formulario de producto (en creación o edición) para no perder datos al navegar entre páginas. |

## Subcarpeta

| Carpeta | Propósito |
|---|---|
| `api-services/` | Servicios dedicados exclusivamente a la **comunicación HTTP con el backend**. |

## Patrón de diseño

- Los servicios de **estado** (auth, cart) usan **Angular Signals** para reactividad moderna.
- Los servicios de **API** están separados en `api-services/` para mantener la separación de responsabilidades.
- Todos están registrados con `providedIn: 'root'` (singleton global).
