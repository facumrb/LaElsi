# LAELSI

La librería “LaElsi” es un negocio dedicado a la venta de productos de librería, juguetería, computación, imprenta digital y sellos. El sitio web contempla ventas, administración y distribución de pedidos desde cualquier parte de Rosario, con el objetivo de ofrecer y expandir los servicios del negocio a más personas.

## Requisitos previos

Antes de abrir el proyecto, asegúrate de tener instalados:

- Node.js (versión 22 LTS o superior)
- npm (versión 10 o superior)
- Angular cli (version 19.0.2) (npm install -g @angular/cli@19.0.2)

## Pasos de instalación en Windows

Si no tienes Node.js instalado, recomendamos usar **fnm** (Fast Node Manager) para gestionar las versiones:

1.  **Instalar fnm:**
    ```powershell
    winget install Schniz.fnm
    ```
2.  **Instalar Node.js v22:**
    ```bash
    fnm install 22
    fnm use 22
    notepad $profile
    Agregar esta linea al doc: fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
    ```
3.  **Instalar Angular CLI**
    ```bash
    npm install -g @angular/cli@19.0.2
    ```

## Cómo abrir el proyecto

Para abrir el proyecto, sigue estos pasos:

**1. Clona este repositorio:**

```bash
   git clone https://github.com/facumrb/LaElsi.git
```

**2. Abre el proyecto en Visual Studio Code:**

- Navega al directorio clonado y abre la carpeta en VS Code.

**3. Agrega las dependencias del proyecto:**

```bash
  npm install
```

**4. Formas de compilar el proyecto:**

- Para ejecutar el **Frontend y Backend** simultáneamente:
  ```bash
  npm run start:dev
  ```
  - Para compilar solo una parte:
    - Navega al directorio correspondiente (`cd fe` o `cd be`).
    - Ejecuta:
      ```bash
      npm run start:dev
      ```
