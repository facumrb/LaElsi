# 📂 `fe/src/` — Raíz del código fuente del Frontend

## ¿Qué es esta carpeta?

Es la **carpeta raíz del código fuente** de la aplicación frontend de LaElsi. Todo lo que el navegador del usuario final renderiza nace de aquí.

## Archivos principales

| Archivo | Función |
|---|---|
| `main.ts` | **Punto de entrada** de la app Angular. Arranca (`bootstrap`) el `AppComponent` con la configuración definida en `AppConfig`. |
| `index.html` | La **página HTML base**. Angular inyecta toda la SPA (Single Page Application) dentro del tag `<app-root>`. |
| `styles.css` | Los **estilos globales** de la aplicación (Tailwind 4 + estilos custom). Se aplican a toda la app sin importar el componente. |

## Subcarpetas

| Carpeta | Propósito |
|---|---|
| `app/` | Contiene **toda la lógica de la aplicación**: componentes, servicios, modelos, rutas, guards, etc. |
| `environments/` | Configuraciones de **variables de entorno** (URLs de API, rutas de uploads, etc.) para desarrollo y producción. |

## Flujo de arranque

```
index.html → main.ts → AppComponent (app.component.ts) → Router → Lazy-loaded pages
```
