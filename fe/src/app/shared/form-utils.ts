import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';

export class FormUtils {
  //EXPRESIONES REGULARES
  static namePattern = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9'\\-\\s\\.&]+$";
  static emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  static descriptionPattern = '^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\\-\'"\\s\\n]*$';

  // Mínimo 8 caracteres, 1 letra, 1 número.
  static passwordPattern = '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$';

  static getTextError(
    errors: ValidationErrors,
    fieldName: string = 'campo',
  ): string | null {
    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return `El ${fieldName} es requerido.`;

        case 'minlength':
          return `Mínimo de ${errors['minlength'].requiredLength} caracteres.`;

        case 'maxlength':
          return `Máximo de ${errors['maxlength'].requiredLength} caracteres.`;

        case 'min':
          return `El valor mínimo es ${errors['min'].min}.`;

        case 'emailTaken':
          return `El correo electronico ya esta siendo usado por otro usuario.`;

        case 'mustMatch':
          return `Las contraseñas no coinciden.`;

        case 'pattern':
          if (errors['pattern'].requiredPattern === this.emailPattern) {
            return 'Formato de correo no válido.';
          }
          if (errors['pattern'].requiredPattern === this.namePattern) {
            return 'El nombre contiene caracteres no permitidos.';
          }
          if (errors['pattern'].requiredPattern === this.passwordPattern) {
            return 'La contraseña debe tener al menos 8 caracteres, una letra y un número.';
          }
          return `El formato del ${fieldName} no es válido.`;
        default:
          return `Error: ${key}`;
      }
    }
    return null;
  }

  static isValidField(form: FormGroup, fieldName: string): boolean | null {
    return (
      !!form.controls[fieldName].errors && form.controls[fieldName].touched
    );
  }

  static getFieldError(form: FormGroup, fieldName: string): string | null {
    if (!form.controls[fieldName]) return null;

    const errors = form.controls[fieldName].errors ?? {};

    return FormUtils.getTextError(errors);
  }

  static isValidFieldInArray(formArray: FormArray, index: number) {
    return (
      formArray.controls[index].errors && formArray.controls[index].touched
    );
  }

  static getFieldErrorInArray(
    formArray: FormArray,
    index: number,
  ): string | null {
    if (formArray.controls.length === 0) return null;

    const errors = formArray.controls[index].errors ?? {};

    return FormUtils.getTextError(errors);
  }

  static isFieldOneEqualFieldTwo(field1: string, field2: string) {
    return (formGroup: AbstractControl) => {
      const field1Value = formGroup.get(field1)?.value;
      const field2Value = formGroup.get(field2)?.value;

      return field1Value === field2Value ? null : { passwordsNotEqual: true };
    };
  }
}
