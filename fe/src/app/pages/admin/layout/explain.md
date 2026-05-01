# 📂 `layout/` — Estructura Visual del Panel Admin

## ¿Qué es esta carpeta?

Define el **layout (estructura visual)** del panel de administración. Es el "esqueleto" que envuelve a todas las páginas del admin.

## Archivos

| Archivo | Función |
|---|---|
| `layout.component.ts` | Componente principal que compone el layout: navbar + sidebar + `<router-outlet>` para el contenido. |
| `layout.component.html` | Template HTML con la estructura visual del panel. |

## Subcarpetas

| Carpeta | Componente |
|---|---|
| `navbar/` | **Barra de navegación superior** del admin. Contiene info del usuario logueado, botón de logout, etc. |
| `sidebar/` | **Menú lateral** con links a todas las secciones del panel (Analíticas, Productos, Categorías, Clientes, Admins, Pedidos). |

## Estructura visual

```
┌────────────────────────────────────────┐
│              NAVBAR                    │
├────────┬───────────────────────────────┤
│        │                               │
│ SIDE   │     <router-outlet>           │
│ BAR    │     (contenido de la página)  │
│        │                               │
└────────┴───────────────────────────────┘
```
