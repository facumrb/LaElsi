# 📂 `audit-info/` — Componente de Información de Auditoría

## ¿Qué es esta carpeta?

Contiene un componente que muestra las **fechas de auditoría** de cualquier entidad del sistema (producto, categoría, usuario, etc.).

## Funcionalidad

Recibe una entidad como input y muestra:
- **Fecha de creación** (`createdAt`)
- **Última modificación** (`updatedAt`)
- **Fecha de eliminación lógica** (`deletedAt`), si aplica

Se usa en los formularios de edición y vistas de detalle del panel admin para dar trazabilidad sobre cuándo fue creada o modificada cada entidad.
