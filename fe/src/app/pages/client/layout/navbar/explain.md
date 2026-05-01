# 📂 `navbar/` — Barra de Navegación del E-commerce

## ¿Qué es esta carpeta?

Contiene el componente principal de la **barra de navegación** de la tienda pública, junto con sus subcomponentes. Es uno de los componentes más complejos del frontend.

## Archivos principales

- `navbar.component.ts` — Lógica principal del navbar (estado del menú, usuario, categorías, carrito).
- `navbar.component.html` — Template que ensambla los subcomponentes.

## Subcarpetas (subcomponentes)

| Carpeta | Componente | Función |
|---|---|---|
| `navbar-top-bar/` | Barra superior | Franja superior con logo, barra de búsqueda, íconos de usuario y carrito. |
| `navbar-category-bar/` | Barra de categorías | Barra con las categorías de productos para navegación rápida. |
| `navbar-mobile-sidebar/` | Sidebar móvil | Menú lateral que aparece en **dispositivos móviles** al tocar el botón hamburguesa. |
| `navbar-accordion-item/` | Ítem de acordeón | Componente para los ítems expandibles del menú móvil. |
| `search-bar/` | Barra de búsqueda | Campo de búsqueda con sugerencias para encontrar productos. |
