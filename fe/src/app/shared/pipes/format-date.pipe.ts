import { Pipe, PipeTransform, inject, LOCALE_ID } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'formatDatePipe',
})
export class FormatDatePipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(value: string | Date | null): string {
    if (!value) return '-';

    const datePipe = new DatePipe(this.locale);
    return datePipe.transform(value, 'dd/MM/yyyy - HH:mm') || '-';
  }
}
