# 📂 `components/` — Componentes Compartidos

## ¿Qué es esta carpeta?

Contiene los **componentes UI reutilizables** que se usan tanto en el panel admin como en el e-commerce. Son las piezas de interfaz más genéricas del proyecto.

## Subcarpetas

| Carpeta | Componente | Descripción |
|---|---|---|
| `buttons/` | Botones reutilizables | Colección de botones estilizados: cerrar modal, filtrar, volver atrás, toggle de contraseña. |
| `pagination/` | Paginador | Componente de **paginación** con botones de página, anterior/siguiente. Se usa en todas las tablas y listados. |
| `order-detail-modal/` | Modal de detalle de orden | **Modal** que muestra el detalle completo de un pedido: productos, cantidades, precios, datos del cliente, estado. |
| `photo-manager/` | Gestor de fotos | Componente para **subir, previsualizar y eliminar fotos** de productos. Soporta múltiples imágenes con drag & drop. |
| `product-image/` | Imagen de producto | Componente para mostrar la **foto de un producto** con fallback si no hay imagen disponible. |
| `filter-accordion/` | Acordeón de filtros | Componente colapsable para agrupar filtros (usado en listados de productos). |
| `logo/` | Logo de LaElsi | Componente que renderiza el **logo** de la marca, reutilizable en navbar, footer, etc. |
| `user-avatar/` | Avatar de usuario | Muestra la **foto de perfil** del usuario o sus iniciales si no tiene foto. |
| `under-development/` | Página en desarrollo | Componente placeholder que indica que una sección está **en desarrollo**. Se usa en páginas no implementadas aún. |
