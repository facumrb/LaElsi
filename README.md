# LAELSI

La librería “LaElsi” es un negocio dedicado a la venta de productos de librería, juguetería, computación, imprenta digital y sellos. El sitio web contempla ventas, administración y distribución de pedidos desde cualquier parte de Rosario, con el objetivo de ofrecer y expandir los servicios del negocio a más personas.

## Requisitos previos

Antes de abrir el proyecto, asegúrate de tener instalados:

- **Node.js**: Versión 22 (LTS) o superior.
- **NPM**: Versión 10 o superior.
- **Angular CLI**: Versión 19.0.2

## Pasos de instalación en Windows

Si no tienes Node.js instalado, recomendamos usar **fnm** (Fast Node Manager) para gestionar las versiones:

1.  **Instalar fnm:**
    ```powershell
    winget install Schniz.fnm
    ```
2.  **Instalar Node.js v22 y configurar PowerShell:**

    ```bash
    fnm install 22
    fnm use 22

    # Configurar el perfil para que fnm cargue siempre:
    notepad $profile
    ```

    _Agrega la siguiente línea al final del archivo que se abrió y guarda:_

    ```powershell
    fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
    ```

3.  **Instalar Angular CLI:**
    ```bash
    npm install -g @angular/cli@19.0.2
    ```

## Cómo abrir el proyecto

Para abrir el proyecto, sigue estos pasos:

**1. Clona este repositorio:**

```bash
git clone https://github.com/facumrb/LaElsi.git
```

**2. Instala las dependencias:**

Ejecuta este comando en la carpeta raíz (instalará las librerías del backend, frontend y herramientas generales):

```bash
npm install
```

**3. Configuración de Variables de Entorno:**

El backend requiere credenciales de base de datos para funcionar.

1.  Ve a la carpeta `be`.
2.  Crea un archivo llamado `.env` (puedes copiar el archivo `.env.example` como base).
3.  Define las variables `DB_USER`, `DB_PASSWORD` y `DB_NAME` con tu configuración local de MySQL.

**4. Ejecución del proyecto:**

Gracias a la arquitectura de Monorepo, puedes ejecutar todo desde la carpeta raíz:

- **Opción A: Todo junto (Recomendado)** Levanta Frontend y Backend simultáneamente:

  ```bash
  npm run start:dev
  ```

- **Opción B: Ejecutar por partes**
  - Solo Backend: `npm run start:dev:be`
  - Solo Frontend: `npm run start:dev:fe`
