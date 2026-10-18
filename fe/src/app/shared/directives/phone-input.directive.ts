import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appPhoneInput]',
})
export class PhoneInputDirective {
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

    // El + solo es válido al inicio del campo y si no hay ya uno
    if (event.key === '+') {
      const input = this.el.nativeElement as HTMLInputElement;
      const cursorAtStart = (input.selectionStart ?? 0) === 0;
      const alreadyHasPlus = input.value.startsWith('+');
      if (!cursorAtStart || alreadyHasPlus) event.preventDefault();
      return;
    }

    // Permitir - y espacio en cualquier posición
    if (['-', ' '].includes(event.key)) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste')
  onPaste() {
    // No se llama a preventDefault() para cumplir con las buenas prácticas de accesibilidad.
    // Se sanitiza el valor resultante en el siguiente tick eliminando caracteres inválidos.
    setTimeout(() => {
      const input = this.el.nativeElement as HTMLInputElement;
      const raw = input.value;
      // El + solo es válido al inicio: lo extraemos, limpiamos el resto y lo reponemos si corresponde
      const hasLeadingPlus = raw.startsWith('+');
      const digits = raw.replace(/[^0-9\-\s]/g, '');
      const sanitized = hasLeadingPlus ? '+' + digits : digits;
      if (raw !== sanitized) {
        input.value = sanitized;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 0);
  }
}
