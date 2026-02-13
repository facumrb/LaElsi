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
  product = input.required<IApiProduct>();
  private readonly imageBaseUrl = environment.productImagesUrl;
  private readonly defaultImage = 'assets/Webp/no-image.webp';

  displayImageUrl = computed(() => {
    const currentProduct = this.product();
    const photos = currentProduct.photos;

    // Si no hay fotos, devolvemos imagen por defecto
    if (!photos || photos.length === 0) {
      return this.defaultImage;
    }

    // Buscamos la foto con order 0
    const mainPhoto = photos.find((p) => p.order === 0);

    // Si existe la 0, usamos esa. Si no, usamos la primera del array como respaldo.
    const photoToUse = mainPhoto || photos[0];

    // Retorno de la URL de la imagen
    return `${this.imageBaseUrl}${photoToUse.fileName}`;
  });

  getProductPrice(): number {
    const currentPrice = this.product().prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.amount : 0;
  }

  getProductCurrency(): string {
    const currentPrice = this.product().prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.currency : 'ARS';
  }
}
