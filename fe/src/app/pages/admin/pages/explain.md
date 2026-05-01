# 📂 `pages/` — Páginas del Panel Admin

## ¿Qué es esta carpeta?

Contiene las **páginas individuales** del panel de administración. Cada subcarpeta es una página completa con su componente principal y, en algunos casos, formularios de creación/edición.

## Subcarpetas

| Carpeta | Página | Descripción |
|---|---|---|
| `analytics-page/` | Dashboard | Página principal del admin con **analíticas y estadísticas** del negocio. |
| `products-page/` | Productos | **ABM de productos**: lista con tabla, formulario de creación/edición con gestión de fotos y precios. |
| `categories-page/` | Categorías | **ABM de categorías**: lista y formulario para organizar los productos. |
| `clients-page/` | Clientes | **ABM de clientes**: lista de clientes registrados con datos personales, dirección y facturación. |
| `admins-page/` | Administradores | **ABM de administradores**: gestión de usuarios con permisos de admin. |
| `orders-page/` | Pedidos | **Gestión de pedidos**: lista de órdenes con estados, detalle, y cambio de estado. |
| `profile-page/` | Perfil Admin | Ver y editar el **perfil propio** del administrador logueado. Contiene subpáginas `view-profile-page/` y `edit-profile-page/`. |

## Patrón ABM

Cada entidad (productos, categorías, etc.) sigue el mismo patrón:
1. **Página principal** (`*-page.component.ts`): tabla con listado, búsqueda, paginación.
2. **Formulario** (`*-form/`): formulario reactivo para crear o editar, reutilizado para ambos modos.
