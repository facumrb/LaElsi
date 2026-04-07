import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapTrash,
  bootstrapPlus,
  bootstrapDash,
  bootstrapCartX,
} from '@ng-icons/bootstrap-icons';
import { IApiProduct } from '@models/product.model';
import { CartService } from '@services/cart.service';
import { AlertService } from '@services/alert.service';
import { ProductImageComponent } from '@shared/components/product-image/product-image.component';

@Component({
  selector: 'app-cart-items',
  imports: [CurrencyPipe, NgIconComponent, ProductImageComponent],
  viewProviders: [
    provideIcons({
      bootstrapTrash,
      bootstrapPlus,
      bootstrapDash,
      bootstrapCartX,
    }),
  ],
  templateUrl: './cart-items.component.html',
})
export class CartItemsComponent {
  private cartService = inject(CartService);
  private alertService = inject(AlertService);

  items = this.cartService.items;

  getCurrentPrice(product: IApiProduct): number {
    return product.prices?.find((p) => p.isCurrent)?.amount || 0;
  }

  updateQuantity(productId: number, quantity: number) {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  async clearCart() {
    const isConfirmed = await this.alertService.confirmDelete(
      'Se eliminarán todos los productos seleccionados',
    );
    if (isConfirmed) {
      this.cartService.clearCart();
    }
  }
}
