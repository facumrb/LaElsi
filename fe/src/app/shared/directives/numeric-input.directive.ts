import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appNumericInput]',
})
export class NumericInputDirective {
  private el = inject(ElementRef);

  private readonly specialKeys = [
    'Backspace',
    'Tab',
    'End',
    'Home',
    'ArrowLeft',
    'ArrowRight',
    'Delete',
    'Enter',
    'Escape',
  ];

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.specialKeys.includes(event.key)) return;

    // Permitir todas las teclas no imprimibles (F1-F12, Shift, Alt, CapsLock, etc.)
    if (event.key.length > 1) return;

    // Permitir Ctrl/Cmd + a, c, v, x, z
    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())
    ) {
      return;
    }

    // Bloquear cualquier carácter que no sea dígito del 0 al 9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste')
  onPaste() {
    // No se llama a preventDefault() para cumplir con las buenas prácticas de accesibilidad.
    // Se sanitiza el valor resultante en el siguiente tick eliminando todo lo que no sea dígito.
    setTimeout(() => {
      const input = this.el.nativeElement as HTMLInputElement;
      const sanitized = input.value.replace(/[^0-9]/g, '');
      if (input.value !== sanitized) {
        input.value = sanitized;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 0);
  }
}
