# 📂 `pipes/` — Pipes (Transformadores de Datos)

## ¿Qué es esta carpeta?

Contiene **pipes Angular** personalizados. Los pipes son funciones que transforman datos directamente en los templates HTML (similar a filtros).

## Archivos

| Pipe | Nombre | Función |
|---|---|---|
| `format-date.pipe.ts` | `formatDate` | Transforma una fecha ISO string en un formato **legible en español** (ej: "1 de mayo de 2026, 14:30 hs"). |

## Ejemplo de uso

```html
<span>{{ order.createdAt | formatDate }}</span>
<!-- Resultado: "1 de mayo de 2026, 14:30 hs" -->
```

## Nota

Por ahora solo hay un pipe, pero esta carpeta está preparada para agregar más transformadores de datos a medida que el proyecto crece.
