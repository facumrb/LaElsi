# 📂 `profile-page/` — Perfil del Cliente

## ¿Qué es esta carpeta?

Contiene la página de **perfil del cliente** y sus subcomponentes. Solo es accesible para usuarios logueados como `Client` (protegido por `clientGuard`).

## Archivos principales

- `profile-page.component.ts` — Componente padre con navegación por tabs entre las secciones del perfil.
- `profile-page.component.html` — Template con menú lateral y `<router-outlet>` para las subsecciones.

## Subcarpeta `components/`

Contiene las **subsecciones** del perfil, cada una cargada como ruta hija:

| Carpeta | Ruta | Descripción |
|---|---|---|
| `profile-details/` | `/profile` | Vista general del perfil: foto, nombre, email, datos personales. |
| `profile-userData/` | `/profile/userData` | Formulario para **editar datos personales** y de dirección del cliente. |
| `profile-orders/` | `/profile/orders` | Lista de **pedidos realizados** por el cliente con estado y detalle de cada orden. |
