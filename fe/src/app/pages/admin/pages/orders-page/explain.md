# 📂 `orders-page/` — Página de Gestión de Pedidos

Página de **gestión de pedidos** del admin (ruta `/admin/orders`).

## Estructura

| Carpeta/Archivo | Función |
|---|---|
| `orders-page.component.ts/html` | Componente padre con lógica de carga, filtrado y paginación de pedidos. |
| `orders-toolbar/` | Barra con título y filtros de estado/búsqueda de pedidos. |
| `orders-list/` | Tabla con la lista de pedidos: ID, cliente, monto total, estado, fecha, acciones (ver detalle, cambiar estado). |

A diferencia de otras entidades, los pedidos **no tienen formulario de creación** desde el admin (se crean desde el e-commerce). El admin solo puede **ver detalles** y **cambiar el estado** (Pendiente → Pagado → Enviado → Entregado / Cancelado).
