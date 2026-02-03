import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  // Recibimos el item desde el @for del padre
  product = input.required<IApiProduct>();

  private readonly imageBaseUrl = environment.imageBaseUrl;

  // Función para traer la imagen
  getImageUrl(fileName: string): string {
    return `${this.imageBaseUrl}${fileName}`;
  }
}
