# 📂 `pages/` — Páginas de la Aplicación

## ¿Qué es esta carpeta?

Organiza todas las **páginas visibles** de la aplicación en 3 módulos principales, cada uno con su propio sistema de rutas (lazy-loaded).

## Subcarpetas (módulos)

| Carpeta | Ruta base | Descripción |
|---|---|---|
| `admin/` | `/admin` | **Panel de administración**. Requiere rol `Admin`. Gestión de productos, categorías, clientes, admins, pedidos y analíticas. |
| `auth/` | `/auth` | **Autenticación**. Solo accesible para usuarios no logueados. Contiene login y registro. |
| `client/` | `/` | **E-commerce público**. La tienda online visible para todos: catálogo, carrito, perfil de cliente, servicios (impresiones, sellos, diseño gráfico). |

## Arquitectura de rutas

```
app.routes.ts
├── /admin → admin.routes.ts (protegido por adminGuard)
├── /auth  → auth.routes.ts  (protegido por guestGuard)
└── /      → client.routes.ts (público)
```

Cada módulo usa **lazy loading**: sus componentes solo se descargan cuando el usuario navega a esa sección, mejorando el rendimiento inicial de la app.
