# 📂 `field-error/` — Componente de Error de Campo

## ¿Qué es esta carpeta?

Contiene un componente dedicado a **mostrar mensajes de error** debajo de los campos de formulario.

## Archivos

- `field-error.component.ts` — Lógica del componente: recibe un `FormControl`, detecta si tiene errores, y usa `FormUtils.getTextError()` para traducir el error a un mensaje legible en español.
- `field-error.component.html` — Template que renderiza el mensaje de error en rojo, solo cuando el campo ha sido "tocado" (touched) y tiene errores.

## Ejemplo de uso

```html
<input formControlName="email" />
<app-field-error [control]="form.controls.email" fieldName="email" />
```

Si el email es inválido, mostrará: _"Formato de correo no válido (ej: usuario@dominio.com)."_

## Importancia

Evita repetir la lógica de mostrar errores en cada formulario. Se usa en **todos los formularios** de la app (login, registro, ABM de productos, categorías, usuarios, etc.).
