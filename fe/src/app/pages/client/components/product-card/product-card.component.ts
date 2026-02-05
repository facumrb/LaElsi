import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IApiProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  // Recibimos el item desde el @for del padre
  product = input.required<IApiProduct>();

  private readonly imageBaseUrl = environment.imageBaseUrl;

  mainPhoto = computed(() => {
    const photos = this.product().photos;

    if (!photos || photos.length === 0) {
      return null; // O una imagen por defecto
    }

    const photoOrderZero = photos.find((p) => p.order === 0);

    return photoOrderZero;
  });

  // Función para traer la imagen
  getImageUrl(fileName: string | undefined): string {
    if (!fileName) return 'assets/no-image.png'; // Manejo de seguridad
    return `${this.imageBaseUrl}${fileName}`;
  }

  getProductPrice(): number {
    const currentPrice = this.product().prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.amount : 0;
  }

  getProductCurrency(): string {
    const currentPrice = this.product().prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.currency : 'ARS';
  }
}
