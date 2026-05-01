# 📂 `layout/` — Estructura Visual del E-commerce

## ¿Qué es esta carpeta?

Define el **layout (estructura visual)** del e-commerce público. Es el esqueleto que envuelve a todas las páginas de la tienda.

## Archivos

| Archivo | Función |
|---|---|
| `layout.component.ts` | Componente que compone: navbar + `<router-outlet>` + footer. |
| `layout.component.html` | Template HTML de la estructura. |

## Subcarpetas

| Carpeta | Componente |
|---|---|
| `navbar/` | **Barra de navegación superior** con logo, búsqueda, categorías, carrito y usuario. Es un componente complejo con múltiples subcomponentes. |
| `footer/` | **Pie de página** con información de contacto, links útiles y redes sociales. |

## Estructura visual

```
┌────────────────────────────────────────┐
│              NAVBAR                    │
│  (logo, búsqueda, categorías, carrito) │
├────────────────────────────────────────┤
│                                        │
│         <router-outlet>                │
│     (contenido de la página actual)    │
│                                        │
├────────────────────────────────────────┤
│              FOOTER                    │
│   (contacto, links, redes sociales)    │
└────────────────────────────────────────┘
```
