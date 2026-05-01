# 📂 `admins-page/` — Página de Gestión de Administradores

Página de **ABM (Alta-Baja-Modificación) de administradores** (ruta `/admin/admins`).

## Estructura

| Carpeta/Archivo | Función |
|---|---|
| `admins-page.component.ts/html` | Componente padre que orquesta la toolbar, lista y lógica de la página. |
| `admins-toolbar/` | Barra de herramientas con título, buscador y botón "Crear admin". |
| `admins-list/` | Tabla con la lista de administradores (nombre, email, username, estado, acciones). |
| `admins-form/` | Formulario reactivo para **crear o editar** un administrador (reutilizado para ambos modos según la ruta). |
