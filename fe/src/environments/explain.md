# 📂 `environments/` — Variables de Entorno

## ¿Qué es esta carpeta?

Contiene los archivos de **configuración por entorno** (desarrollo, producción, etc.). Angular reemplaza automáticamente el archivo correcto según el modo de compilación (`ng serve` usa `environment.development.ts`, `ng build` usa `environment.ts`).

## Archivos

| Archivo | Entorno |
|---|---|
| `environment.ts` | **Producción** (o por defecto). |
| `environment.development.ts` | **Desarrollo local**. |

## ¿Qué contienen?

Definen constantes como:

- `baseUrl` — URL base del servidor backend (ej: `http://localhost:3000`).
- `apiUrl` — URL base de la API REST (`baseUrl + /api`).
- `productImagesUrl` — Ruta para acceder a las **imágenes de productos** subidas al servidor.
- `userImagesUrl` — Ruta para acceder a las **fotos de perfil de usuarios**.

## ¿Por qué importa?

Permite cambiar las URLs del backend sin tocar el código de los servicios. Al desplegar a producción, solo se cambia `environment.ts` con las URLs del servidor real.
