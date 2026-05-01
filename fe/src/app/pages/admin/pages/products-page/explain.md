# 📂 `products-page/` — Página de Gestión de Productos

Página de **ABM de productos** (ruta `/admin/products`). Es una de las páginas más complejas del admin.

## Estructura

| Carpeta/Archivo | Función |
|---|---|
| `products-page.component.ts/html` | Componente padre con lógica de carga, búsqueda, filtrado y paginación. |
| `products-toolbar/` | Barra con título, buscador y botón "Crear producto". |
| `products-list/` | Tabla con la lista de productos (imagen, nombre, marca, precio, stock, categoría, estado, acciones). |
| `products-form/` | Formulario completo para **crear o editar** un producto: datos básicos, precio, stock, categoría, y gestor de fotos. Soporta el sistema de borradores (`ProductDraftService`). |
