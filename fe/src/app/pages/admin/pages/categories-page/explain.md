# 📂 `categories-page/` — Página de Gestión de Categorías

Página de **ABM de categorías** de productos (ruta `/admin/categories`).

## Estructura

| Carpeta/Archivo | Función |
|---|---|
| `categories-page.component.ts/html` | Componente padre que orquesta la toolbar, lista y lógica. |
| `categories-toolbar/` | Barra con título, buscador y botón "Crear categoría". |
| `categories-list/` | Tabla con la lista de categorías (nombre, estado, acciones). |
| `categories-form/` | Formulario para **crear o editar** una categoría. Incluye validación de unicidad de nombre. |
