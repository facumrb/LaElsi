import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

// Directiva para eliminar espacios en blanco al final de los inputs

@Directive({
  // Intercepta todos los inputs de tipo texto y textareas
  selector:
    'input[type="text"], input[type="email"], input[type="search"], textarea',
})
export class TrimInputDirective {
  private ngControl = inject(NgControl, { optional: true });
  private el = inject(ElementRef);

  @HostListener('blur')
  onBlur(): void {
    const value = this.el.nativeElement.value;

    if (value && typeof value === 'string') {
      const trimmedValue = value.trim().replace(/\s{2,}/g, ' ');

      // Sólo actualizamos si realmente hubo cambios para evitar ciclos o re-lanzar eventos innecesariamente
      if (trimmedValue !== value) {
        this.el.nativeElement.value = trimmedValue;
        if (this.ngControl && this.ngControl.control) {
          // emitEvent hace que se disparen las validaciones correspondientes con el string limpio
          this.ngControl.control.setValue(trimmedValue, { emitEvent: true });
        }
      }
    }
  }
}
