# 📂 `shared/` — Recursos Compartidos

## ¿Qué es esta carpeta?

Contiene recursos **reutilizables en toda la aplicación**, tanto en el módulo admin como en el client. Son piezas genéricas que no pertenecen a un módulo específico.

## Subcarpetas

| Carpeta | Tipo | Descripción |
|---|---|---|
| `components/` | **Componentes** | Componentes UI reutilizables: botones, paginación, modales, gestor de fotos, logo, avatar, etc. |
| `directives/` | **Directivas** | Directivas Angular personalizadas que modifican el comportamiento de elementos HTML (click outside, input numérico, etc.). |
| `pipes/` | **Pipes** | Transformadores de datos para templates (formateo de fechas). |
| `validators/` | **Validadores** | Utilidades para validación de formularios reactivos y un componente para mostrar errores. |

## Importancia

Esta carpeta es **crítica** para la consistencia visual y funcional de la app. Al centralizar componentes y utilidades compartidas, se evita la duplicación de código y se asegura que los cambios se reflejen en toda la aplicación.
