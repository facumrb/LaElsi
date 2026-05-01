# 📂 `api-services/` — Servicios de Comunicación con el Backend

## ¿Qué es esta carpeta?

Contiene todos los servicios que realizan **peticiones HTTP al backend** (API REST). Cada servicio está dedicado a una entidad o dominio específico del negocio.

## Archivos

| Servicio | Endpoints que consume | Operaciones |
|---|---|---|
| `api-product.service.ts` | `/api/products` | CRUD completo de productos: listar (con filtros, paginación, búsqueda), obtener por ID, crear, editar, eliminar, restaurar. |
| `api-category.service.ts` | `/api/categories` | CRUD de categorías: listar, obtener, crear, editar, eliminar, restaurar. |
| `api-order.service.ts` | `/api/orders` | Gestión de pedidos: listar, crear, actualizar estado, actualizar método de entrega. |
| `api-admin.service.ts` | `/api/admins` | ABM de administradores: listar, obtener, crear, editar, eliminar, restaurar. |
| `api-client.service.ts` | `/api/clients` | ABM de clientes: listar, obtener, crear, editar, eliminar, restaurar. |
| `api-photo.service.ts` | `/api/photos` | Gestión de fotos: subir foto de producto, subir foto de usuario, eliminar foto. |
| `api-error.service.ts` | — (no hace peticiones) | **Manejo centralizado de errores HTTP**: traduce los códigos de error del backend a mensajes amigables y los muestra con `AlertService`. |

## Patrón de diseño

- Todos usan `HttpClient` para las peticiones.
- Retornan `Observable<T>` y extraen los datos con `.pipe(map(res => res.data))`.
- La URL base proviene de `environment.apiUrl`.
- El token de autenticación se adjunta automáticamente vía `authInterceptor`.
