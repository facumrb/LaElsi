import { Directive, ElementRef, output, HostListener } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
})
export class ClickOutsideDirective {
  // Este evento se emitirá cuando el usuario haga clic fuera del menu
  clickOutside = output<void>();

  constructor(private elementRef: ElementRef) {}

  // Escuchamos todos los clics del documento
  @HostListener('document:click', ['$event'])
  public onClick(event: MouseEvent): void {
    // Convertimos explícitamente el target a un HTMLElement
    const targetElement = event.target as HTMLElement;

    // Verificación de seguridad (por si el target es nulo)
    if (!targetElement) {
      return;
    }

    // Si el elemento donde pusimos la directiva NO contiene al elemento clickeado...
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);

    if (!clickedInside) {
      // ... entonces fue un clic afuera. Emitimos el evento.
      this.clickOutside.emit();
    }
  }

  // 2. Lógica para la tecla Escape (Teclado)
  @HostListener('document:keydown.escape')
  public onEscapeKey(): void {
    this.clickOutside.emit();
  }
}
