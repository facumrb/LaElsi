import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumericInput]',
})
export class NumericInputDirective {
  // Teclas de navegación permitidas
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
    // Permitir teclas especiales de navegación
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    // Permitir combinaciones con Ctrl o Command (Copiar, Pegar, Seleccionar todo)
    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())
    ) {
      return;
    }

    // Validar si es un número
    // Si NO es un número del 0 al 9, prevenimos la escritura
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Prevenir pegar texto que no sea numérico
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';

    // Si el texto pegado contiene algo que no sea número, bloqueamos
    if (!/^[0-9]+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
