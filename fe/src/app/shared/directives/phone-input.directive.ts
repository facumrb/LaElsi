import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appPhoneInput]',
})
export class PhoneInputDirective {
  private specialKeys: Array<string> = [
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
    // Permitir navegación
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    // Permitir Ctrl+A, C, V, X...
    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())
    ) {
      return;
    }

    // Permitir Números, Más (+), Menos (-) y Espacio
    if (['+', '-', ' '].includes(event.key)) {
      return;
    }

    // Si NO es número (y no pasó los filtros anteriores), bloquear
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Validación al pegar: Permite números, espacios, + y -
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';

    if (!/^[0-9+\-\s]+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
