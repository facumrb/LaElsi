import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '@services/cart.service';
import { ApiOrderService } from '@services/api-order.service';
import { AuthService } from '@services/auth.service';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapTrash,
  bootstrapPlus,
  bootstrapDash,
  bootstrapCartX,
  bootstrapWhatsapp,
  bootstrapInfoCircle,
} from '@ng-icons/bootstrap-icons';
import { environment } from 'src/environments/environment';
import { DeliveryMethod } from '@models/order.model';

@Component({
  selector: 'app-cart-page',
  imports: [CurrencyPipe, RouterLink, NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapTrash,
      bootstrapPlus,
      bootstrapDash,
      bootstrapCartX,
      bootstrapWhatsapp,
      bootstrapInfoCircle,
    }),
  ],
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent {
  private cartService = inject(CartService);
  private apiOrderService = inject(ApiOrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  items = this.cartService.items;
  totalAmount = this.cartService.totalAmount;
  totalItems = this.cartService.totalItems;

  mpAlias = 'laelsi.libreria.mp';
  imageBaseUrl = environment.productImagesUrl;

  // Selección de envío
  deliveryMethods = Object.values(DeliveryMethod);
  shippingMethod = signal<DeliveryMethod>(DeliveryMethod.RetiroSucursal);
  DeliveryMethodEnum = DeliveryMethod;

  updateQuantity(productId: number, quantity: number) {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  clearCart() {
    Swal.fire({
      title: '¿Vaciar carrito?',
      text: 'Se eliminarán todos los productos seleccionados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.clearCart();
      }
    });
  }

  checkout() {
    const user = this.authService.currentUser();
    if (!user) {
      Swal.fire({
        title: 'Inicia sesión',
        text: 'Para finalizar la compra, necesitas identificarte.',
        icon: 'info',
        confirmButtonText: 'Ir al Login',
        confirmButtonColor: '#3d4494',
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    const orderData = {
      clientId: user.id,
      deliveryMethod: this.shippingMethod(),
      items: this.items().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    Swal.fire({
      title: 'Confirmar pedido',
      text: `El total es ${this.totalAmount().toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}. ¿Deseas confirmar la compra?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'No, revisar',
      confirmButtonColor: '#3d4494',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiOrderService.createOrder(orderData).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Pedido realizado!',
              text: 'Tu pedido ha sido creado correctamente. Por favor, realiza el pago usando el alias proporcionado.',
              icon: 'success',
              confirmButtonColor: '#3d4494',
            });
            this.cartService.clearCart();
            this.router.navigate(['/client/profile']); // O a una página de mis pedidos si existiera
          },
          error: (err) => {
            Swal.fire(
              'Error',
              err.error?.message || 'Hubo un problema al procesar el pedido.',
              'error',
            );
          },
        });
      }
    });
  }

  setShippingMethod(method: DeliveryMethod) {
    this.shippingMethod.set(method);
  }

  whatsAppLink = computed(() => {
    const message =
      `Hola La Elsi! Quiero realizar un pedido:\n\n` +
      this.items()
        .map((i) => `- ${i.product.name} x${i.quantity}`)
        .join('\n') +
      `\n\nTotal: ${this.totalAmount().toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
      })}`;
    return `https://wa.me/543411111111?text=${encodeURIComponent(message)}`;
  });
}
