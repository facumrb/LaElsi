import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '@services/cart.service';
import { ApiOrderService } from '@services/api-services/api-order.service';
import { AuthService } from '@services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '@services/alert.service';
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
import { IApiProduct } from '@models/product.model';

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
  private alertService = inject(AlertService);
  imageBaseUrl = environment.productImagesUrl;

  items = this.cartService.items;
  totalAmount = this.cartService.totalAmount;
  totalItems = this.cartService.totalItems;

  getCurrentPrice(product: IApiProduct): number {
    return product.prices?.find((p) => p.isCurrent)?.amount || 0;
  }

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
      this.alertService.success('Alias copiado');
    });
  }

  async clearCart() {
    const isConfirmed = await this.alertService.confirmDelete('Se eliminarán todos los productos seleccionados');
    if (isConfirmed) {
      this.cartService.clearCart();
    }
  }

  async checkout() {
    const user = this.authService.currentUser();
    if (!user) {
      this.alertService.modal('Inicia sesión', 'Para finalizar la compra, necesitas identificarte.', 'info');
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

    const confirmText = `El total es ${this.totalAmount().toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}. ¿Deseas confirmar la compra?`;
    const isConfirmed = await this.alertService.confirmAction('Confirmar pedido', confirmText, 'Sí, confirmar');

    if (isConfirmed) {
      this.apiOrderService.createOrder(orderData).subscribe({
        next: () => {
          const isTransfer =
            this.paymentMethod() === PaymentMethod.Transferencia;
          const successText = isTransfer
            ? `Tu pedido se ha recibido correctamente.<br><br>Realiza el pago al alias: <b>${this.mpAlias}</b><br><br>Recuerda enviar el comprobante a nuestro Whatsapp: <b>+54 9 3417121860</b>`
            : 'Tu pedido se ha recibido correctamente.';

          this.alertService.modal('¡Pedido realizado!', successText, 'success');
          this.cartService.clearCart();
          this.router.navigate(['/client/profile/orders']);
        }
      });
    }
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
