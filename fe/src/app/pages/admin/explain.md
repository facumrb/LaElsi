# 📂 `admin/` — Módulo de Administración

## ¿Qué es esta carpeta?

Contiene todo lo relacionado con el **panel de administración** de LaElsi. Solo es accesible por usuarios con rol `Admin` (protegido por `adminGuard`).

## Estructura

| Carpeta/Archivo | Propósito |
|---|---|
| `admin.routes.ts` | Define todas las rutas del panel: analytics, admins, clients, categories, products, orders, profile. Todas con lazy loading. |
| `layout/` | **Estructura visual** del panel: navbar superior + sidebar lateral + área de contenido. |
| `components/` | **Componentes reutilizables** exclusivos del admin: tablas, toolbars, badges de estado, info de auditoría. |
| `pages/` | Las **páginas individuales** del panel de administración. |

## Rutas disponibles

| Ruta | Página |
|---|---|
| `/admin` | Redirige a `/admin/analytics` |
| `/admin/analytics` | Dashboard con analíticas |
| `/admin/admins` | ABM de administradores |
| `/admin/clients` | ABM de clientes |
| `/admin/categories` | ABM de categorías |
| `/admin/products` | ABM de productos |
| `/admin/orders` | Gestión de pedidos |
| `/admin/view-profile` | Ver perfil del admin |
| `/admin/edit-profile` | Editar perfil del admin |
