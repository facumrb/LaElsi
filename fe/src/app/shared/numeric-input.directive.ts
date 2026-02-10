import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumericInput]',
})
export class NumericInputDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (
      [46, 8, 9, 27, 13].indexOf(event.keyCode) !== -1 ||
      ((event.ctrlKey || event.metaKey) &&
        ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) ||
      (event.keyCode >= 35 && event.keyCode <= 39)
    ) {
      return;
    }

    if (
      (event.shiftKey || event.keyCode < 48 || event.keyCode > 57) &&
      (event.keyCode < 96 || event.keyCode > 105)
    ) {
      event.preventDefault();
    }
  }
}
