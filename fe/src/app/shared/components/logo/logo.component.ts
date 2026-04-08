import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <img
      src="assets/Webp/Logo.webp"
      alt="Logo de Laelsi"
      [class]="customClass()"
      [attr.width]="width()"
      [attr.height]="height()"
      [attr.loading]="loading()"
    />
  `,
})
export class LogoComponent {
  customClass = input<string>('');
  width = input.required<number>();
  height = input.required<number>();
  loading = input<'lazy' | 'eager'>('lazy');
}
