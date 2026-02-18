import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appPriceAdjustmentInput]',
  standalone: true,
})
export class PriceAdjustmentInputDirective {
  private el = inject(ElementRef);

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

    // Simular cómo quedaría el valor si permitimos esta tecla
    const input = this.el.nativeElement as HTMLInputElement;
    const currentVal = input.value;

    // Obtenemos la posición del cursor para saber dónde se insertará el carácter
    // o qué texto se va a sobrescribir si hay selección
    const positionStart = input.selectionStart || 0;
    const positionEnd = input.selectionEnd || 0;

    const key = event.key;

    // Construimos el "futuro valor" cortando el string actual e insertando la tecla
    const nextVal =
      currentVal.substring(0, positionStart) +
      key +
      currentVal.substring(positionEnd);

    const isValid = /^-?\d*\.?\d*$/.test(nextVal);

    if (!isValid) {
      event.preventDefault();
    }
  }

  // Prevenir pegar texto inválido
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';

    // Validamos que lo pegado cumpla formato numérico (puede ser negativo y decimal)
    if (
      !/^-?\d+(\.\d+)?$/.test(pastedText) &&
      !/^-?\d*\.\d+$/.test(pastedText)
    ) {
      event.preventDefault();
    }
  }
}
