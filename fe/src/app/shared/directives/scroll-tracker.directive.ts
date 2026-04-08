import {
  Directive,
  ElementRef,
  HostListener,
  signal,
  inject,
  AfterViewInit,
} from '@angular/core';

// Directiva utilizada para los botones < y > de los carruseles

@Directive({
  selector: '[appScrollTracker]',
  exportAs: 'scrollTracker',
})
export class ScrollTrackerDirective implements AfterViewInit {
  private el = inject(ElementRef<HTMLElement>);

  atStart = signal(true);
  atEnd = signal(false);

  private suspendTracking = false;

  ngAfterViewInit() {
    // Timeout para asegurar que el contenido dentro del carrusel ya ha sido pintado
    setTimeout(() => this.checkScroll(), 0);
  }

  // Método para forzar estado desde botones (prediccción instantánea)
  forceState(isAtStart: boolean, isAtEnd: boolean) {
    this.atStart.set(isAtStart);
    this.atEnd.set(isAtEnd);

    // Suspendemos la re-evaluación por 600ms para evitar que los eventos 'scroll'
    // intermedios del native smooth scrolling nos pisen el estado final esperado.
    this.suspendTracking = true;
    setTimeout(() => {
      this.suspendTracking = false;
      this.checkScroll(); // Chequeamos posición real final
    }, 200);
  }

  @HostListener('scroll')
  onScroll() {
    this.checkScroll();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScroll();
  }

  checkScroll() {
    if (this.suspendTracking) return;

    const element = this.el.nativeElement;
    // Agregamos en start y end un margen de tolerancia de 5px para errores de redondeo de renderización
    this.atStart.set(element.scrollLeft <= 5);
    this.atEnd.set(
      Math.ceil(element.scrollLeft + element.clientWidth) >=
        element.scrollWidth - 5,
    );
  }
}
