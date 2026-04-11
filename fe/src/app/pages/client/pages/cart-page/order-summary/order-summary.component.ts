import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DeliveryMethod, PaymentMethod } from '@models/order.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapWhatsapp,
  bootstrapInfoCircle,
  bootstrapCopy,
} from '@ng-icons/bootstrap-icons';
import { CartService } from '@services/cart.service';
import { ApiOrderService } from '@services/api-services/api-order.service';
import { AuthService } from '@services/auth.service';
import { AlertService } from '@services/alert.service';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe, NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapWhatsapp,
      bootstrapInfoCircle,
      bootstrapCopy,
    }),
  ],
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  private cartService = inject(CartService);
  private apiOrderService = inject(ApiOrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  totalItems = this.cartService.totalItems;
  totalAmount = this.cartService.totalAmount;
  items = this.cartService.items; // Necesario para el WhatsApp link

  DeliveryMethodEnum = DeliveryMethod;
  PaymentMethodEnum = PaymentMethod;

  shippingMethod = signal<DeliveryMethod>(DeliveryMethod.RetiroSucursal);
  paymentMethod = signal<PaymentMethod>(PaymentMethod.Transferencia);
  mpAlias = 'laelsi.libreria.mp';

  setShippingMethod(method: DeliveryMethod) {
    this.shippingMethod.set(method);
  }

  setPaymentMethod(method: PaymentMethod) {
    this.paymentMethod.set(method);
  }

  copyAlias() {
    navigator.clipboard.writeText(this.mpAlias).then(() => {
      this.alertService.success('Alias copiado');
    });
  }

  async checkout() {
    const user = this.authService.currentUser();
    if (!user) {
      this.alertService.modal(
        'Inicia sesión',
        'Para finalizar la compra, necesitas identificarte.',
        'info',
      );
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
    const isConfirmed = await this.alertService.confirmAction(
      'Confirmar pedido',
      confirmText,
      'Sí, confirmar',
    );

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
        },
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
