# 📂 `app/` — Núcleo de la Aplicación Angular

## ¿Qué es esta carpeta?

Es el **corazón de toda la aplicación**. Contiene absolutamente todo: componentes, páginas, servicios, modelos de datos, guards de seguridad, interceptores HTTP, y recursos compartidos.

## Archivos raíz

| Archivo | Función |
|---|---|
| `app.component.ts` | **Componente raíz**. Solo renderiza un `<router-outlet>` e inyecta el servicio de historial de navegación para el botón "Volver". |
| `app.config.ts` | **Configuración global** de Angular: registra el router, HttpClient con interceptores (auth + error), y el locale `es-AR` para formatos argentinos. |
| `app.routes.ts` | **Rutas principales** de la app. Define 3 zonas con lazy loading: `admin/` (protegida con `adminGuard`), `auth/` (protegida con `guestGuard`), y `/` (tienda pública). |

## Subcarpetas

| Carpeta | Propósito |
|---|---|
| `guards/` | **Protección de rutas** — controlan quién puede acceder a cada sección (admin, cliente, invitado). |
| `interceptors/` | **Interceptores HTTP** — modifican automáticamente las peticiones (agregan token) y respuestas (manejan errores). |
| `models/` | **Interfaces TypeScript** — definen la forma de los datos (productos, usuarios, órdenes, etc.). |
| `pages/` | **Páginas de la app** — organizadas en 3 módulos: `admin/`, `auth/`, `client/`. |
| `services/` | **Servicios** — lógica de negocio, comunicación con la API, gestión de estado (auth, carrito, alertas). |
| `shared/` | **Recursos compartidos** — componentes, directivas, pipes y validadores reutilizables en toda la app. |

## Arquitectura general

La app se divide en **3 zonas principales**:
1. **Client** (`/`) — E-commerce público: catálogo, carrito, perfil de cliente.
2. **Admin** (`/admin`) — Panel de administración: ABM de productos, categorías, usuarios, pedidos.
3. **Auth** (`/auth`) — Login y registro de usuarios.
