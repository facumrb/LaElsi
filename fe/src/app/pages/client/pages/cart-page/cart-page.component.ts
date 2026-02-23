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
import { DeliveryMethod, PaymentMethod } from '@models/order.model';

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
  imageBaseUrl = environment.productImagesUrl;

  items = this.cartService.items;
  totalAmount = this.cartService.totalAmount;
  totalItems = this.cartService.totalItems;

  updateQuantity(productId: number, quantity: number) {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  // Selección de metodo de envío
  deliveryMethods = Object.values(DeliveryMethod);
  shippingMethod = signal<DeliveryMethod>(DeliveryMethod.RetiroSucursal);
  DeliveryMethodEnum = DeliveryMethod;
  setShippingMethod(method: DeliveryMethod) {
    this.shippingMethod.set(method);
  }

  // Selección de metodo de pago
  paymentMethod = signal<PaymentMethod>(PaymentMethod.Transferencia);
  PaymentMethodEnum = PaymentMethod;
  mpAlias = 'laelsi.libreria.mp';
  setPaymentMethod(method: PaymentMethod) {
    this.paymentMethod.set(method);
  }

  // Método para copiar el alias al portapapeles
  copyAlias() {
    navigator.clipboard.writeText(this.mpAlias).then(() => {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Alias copiado',
        showConfirmButton: false,
        timer: 1500,
      });
    });
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
      paymentMethod: this.paymentMethod(),
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
            const isTransfer =
              this.paymentMethod() === PaymentMethod.Transferencia;
            const successText = isTransfer
              ? `Tu pedido ha sido creado correctamente. Realiza el pago al alias ${this.mpAlias}. Recuerda enviar el comprobante a nuestro Whatsapp: +54 9 3417121860`
              : 'Tu pedido ha sido creado correctamente.';

            Swal.fire({
              title: '¡Pedido realizado!',
              text: successText,
              icon: 'success',
              confirmButtonColor: '#3d4494',
            });
            this.cartService.clearCart();
            this.router.navigate(['/client/profile/orders']);
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

  whatsAppLink = computed(() => {
    const message =
      `Hola! Quiero realizar un pedido:\n\n` +
      this.items()
        .map((i) => `- ${i.product.name} x${i.quantity}`)
        .join('\n') +
      `\n\nTotal: ${this.totalAmount().toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
      })}`;
    return `https://wa.me/5493417121860?text=${encodeURIComponent(message)}`;
  });
}
