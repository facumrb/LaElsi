import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumericInput]',
})
export class NumericInputDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Tu lógica original
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  }
}
