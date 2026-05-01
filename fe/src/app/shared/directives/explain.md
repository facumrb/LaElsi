# 📂 `directives/` — Directivas Personalizadas

## ¿Qué es esta carpeta?

Contiene **directivas Angular** personalizadas. Las directivas son atributos que se agregan a elementos HTML para modificar su comportamiento sin crear un componente nuevo.

## Archivos

| Directiva | Selector | Función |
|---|---|---|
| `click-outside.directive.ts` | `[clickOutside]` | Detecta clics **fuera** del elemento (y tecla Escape) para cerrar menús, dropdowns, modales. Emite un evento `clickOutside`. |
| `numeric-input.directive.ts` | `[numericInput]` | Restringe un `<input>` para que solo acepte **números enteros**. Bloquea letras y caracteres especiales. |
| `phone-input.directive.ts` | `[phoneInput]` | Restringe un `<input>` para formato de **teléfono**: solo números, espacios, guiones y signo +. |
| `price-adjustment-input.directive.ts` | `[priceAdjustmentInput]` | Formatea automáticamente el valor como **precio** con decimales y separadores. |
| `scroll-tracker.directive.ts` | `[scrollTracker]` | Detecta cuando el usuario hace **scroll** y emite eventos (útil para lazy loading o animaciones al scrollear). |
| `trim-input.directive.ts` | `[trimInput]` | Elimina automáticamente los **espacios en blanco** al inicio y final del valor de un input al perder el foco (blur). |

## Ejemplo de uso

```html
<input type="text" clickOutside (clickOutside)="cerrarMenu()" />
<input type="text" numericInput />
```
