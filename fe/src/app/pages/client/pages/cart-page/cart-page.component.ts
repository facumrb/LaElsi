import { Component, inject } from '@angular/core';
import { CartService } from '@services/cart.service';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapCartX } from '@ng-icons/bootstrap-icons';
import { CartItemsComponent } from './cart-items/cart-items.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';

@Component({
  selector: 'app-cart-page',
  imports: [
    RouterLink,
    NgIconComponent,
    CartItemsComponent,
    OrderSummaryComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapCartX,
    }),
  ],
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent {
  private cartService = inject(CartService);

  items = this.cartService.items;
  totalItems = this.cartService.totalItems;
}
