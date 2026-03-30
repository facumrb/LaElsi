import { Component, input, inject, computed, signal } from '@angular/core';
import { CartService } from '@services/cart.service';
import { IApiProduct } from '@models/product.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPlus, bootstrapDash, bootstrapPlusLg, bootstrapDashLg } from '@ng-icons/bootstrap-icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-to-cart-control',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  viewProviders: [provideIcons({ bootstrapPlus, bootstrapDash, bootstrapPlusLg, bootstrapDashLg })],
  templateUrl: './add-to-cart-control.component.html',
})
export class AddToCartControlComponent {
  product = input.required<IApiProduct>();
  layout = input<'compact' | 'full'>('compact');

  private cartService = inject(CartService);

  // Computed signal to reactively find current quantity of THIS product in the cart
  currentQuantity = computed(() => {
    const items = this.cartService.items();
    return items.find((i) => i.product.id === this.product().id)?.quantity || 0;
  });

  // Calculate if we can add more based on stock
  canIncrease = computed(() => {
    const qty = this.currentQuantity();
    const stock = this.product().stock;
    return qty < stock;
  });

  addInitial(event: Event) {
    this.stopEvent(event);
    if (this.product().stock > 0) {
      this.cartService.addToCart(this.product(), 1);
    }
  }

  increment(event: Event) {
    this.stopEvent(event);
    if (this.canIncrease()) {
      this.cartService.updateQuantity(this.product().id, this.currentQuantity() + 1);
    }
  }

  decrement(event: Event) {
    this.stopEvent(event);
    const newQty = this.currentQuantity() - 1;
    this.cartService.updateQuantity(this.product().id, newQty);
  }

  private stopEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }
}
