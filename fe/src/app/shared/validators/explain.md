# 📂 `validators/` — Validadores y Utilidades de Formularios

## ¿Qué es esta carpeta?

Contiene las **utilidades de validación** para formularios reactivos de Angular. Es una pieza central del proyecto ya que todos los formularios (login, registro, ABM de entidades) dependen de estas utilidades.

## Archivos

| Archivo | Función |
|---|---|
| `form-utils.ts` | **Clase utilitaria `FormUtils`** con métodos estáticos para validación de formularios. Incluye: |
| | — Expresiones regulares para email, nombre, contraseña, CUIT, teléfono, username. |
| | — Validadores custom de `minLength`/`maxLength` que hacen trim de espacios. |
| | — `getTextError()`: traduce errores de validación a **mensajes en español** (ej: "El email es requerido"). |
| | — `isValidField()` / `getFieldError()`: helpers para mostrar errores en templates. |
| | — `notOnlyWhiteSpace`: valida que un campo no contenga solo espacios. |
| | — `isFieldOneEqualFieldTwo`: valida que dos campos coincidan (ej: contraseña y confirmación). |
| | — `uniqueFieldValidator()`: **validador asíncrono** que consulta al backend si un valor (email, username, DNI, CUIT) ya está en uso. Incluye debounce de 400ms. |

## Subcarpeta

| Carpeta | Componente | Función |
|---|---|---|
| `field-error/` | `FieldErrorComponent` | Componente que muestra el **mensaje de error** de un campo de formulario de forma visual (texto rojo debajo del input). Recibe el control del formulario y traduce automáticamente el error. |

## Importancia

Centraliza toda la lógica de validación en un solo lugar, garantizando consistencia en los mensajes de error y las reglas de validación en toda la aplicación.
