# 📂 `client/` — Módulo del E-commerce (Tienda Pública)

## ¿Qué es esta carpeta?

Contiene todo el **e-commerce público** de LaElsi: la tienda online que ven los clientes. Es la parte principal de la aplicación, accesible sin autenticación (excepto el perfil).

## Estructura

| Carpeta/Archivo | Propósito |
|---|---|
| `client.routes.ts` | Rutas del e-commerce: home, categorías, productos, carrito, impresiones, sellos, diseño gráfico, perfil, búsqueda, FAQ, about us. |
| `layout/` | **Estructura visual**: navbar superior + footer + área de contenido. |
| `components/` | **Componentes reutilizables** exclusivos del e-commerce (cards de producto, filtros, breadcrumbs, etc.). |
| `pages/` | Las **páginas individuales** de la tienda. |

## Rutas principales

| Ruta | Página |
|---|---|
| `/` | Página principal (home) con productos destacados |
| `/category/:id` | Productos filtrados por categoría |
| `/product/:id` | Detalle de un producto |
| `/cart` | Carrito de compras |
| `/search` | Resultados de búsqueda |
| `/impresiones` | Servicios de impresión |
| `/sellos` | Servicios de sellos |
| `/disenio` | Servicios de diseño gráfico |
| `/profile` | Perfil del cliente (protegido por `clientGuard`) |
| `/about-us` | Acerca de LaElsi |
| `/faq` | Preguntas frecuentes |
