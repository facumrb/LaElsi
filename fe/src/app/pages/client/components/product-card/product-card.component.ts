import { Component, computed, input, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IApiProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';
import { CartService } from '@services/cart.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapCartPlus, bootstrapCheckLg } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({ bootstrapCartPlus, bootstrapCheckLg })],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  product = input.required<IApiProduct>();
  private readonly imageBaseUrl = environment.productImagesUrl;
  private readonly defaultImage = 'assets/Webp/no-image.webp';
  private cartService = inject(CartService);
  addedToCart = signal(false);

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

  price = computed(() => {
    const currentPrice = this.product().prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.amount : 0;
  });

  currency = computed(() => {
    const currentPrice = this.product().prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.currency : 'ARS';
  });

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement.src.includes(this.defaultImage)) return;
    imgElement.src = this.defaultImage;
  }

  addToCart(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.product().stock > 0) {
      this.cartService.addToCart(this.product());
      this.addedToCart.set(true);
      setTimeout(() => {
        this.addedToCart.set(false);
      }, 2000);
    }
  }
}
