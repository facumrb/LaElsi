import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <img
      src="assets/Webp/Logo.webp"
      [alt]="alt()"
      [class]="customClass()"
      [attr.width]="width()"
      [attr.height]="height()"
      [attr.loading]="loading()"
    />
  `,
})
export class LogoComponent {
  width = input.required<number>();
  height = input.required<number>();
  alt = input<'Logo de Laelsi' | 'Laelsi'>('Logo de Laelsi');
  loading = input<'lazy' | 'eager'>('lazy');
  customClass = input<string>('');
}
