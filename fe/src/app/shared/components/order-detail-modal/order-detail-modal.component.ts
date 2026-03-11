import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  inject,
  computed,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapX,
  bootstrapPerson,
  bootstrapEnvelope,
  bootstrapWhatsapp,
} from '@ng-icons/bootstrap-icons';
import { IApiOrder, OrderState, PaymentMethod } from '@models/order.model';
import { environment } from 'src/environments/environment';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-order-detail-modal',
  imports: [
    NgIconComponent,
    CurrencyPipe,
    DatePipe,
    ClickOutsideDirective,
    RouterModule,
  ],
  viewProviders: [
    provideIcons({
      bootstrapX,
      bootstrapPerson,
      bootstrapEnvelope,
      bootstrapWhatsapp,
    }),
  ],
  templateUrl: './order-detail-modal.component.html',
})
export class OrderDetailModalComponent implements OnInit, OnDestroy {
  order = input.required<IApiOrder>();
  showClientInfo = input<boolean>(false); // Opcional: mostrar info de contacto del cliente
  close = output<void>();
  onCancel = output<number>(); // Emite el ID de la orden a cancelar

  mpAlias = 'laelsi.libreria.mp';
  OrderState = OrderState;
  PaymentMethod = PaymentMethod;

  private document = inject(DOCUMENT);
  private authService = inject(AuthService);
  productImagesUrl = environment.productImagesUrl;

  currentUserName = computed(() => {
    const user = this.authService.currentUser();
    if (user) {
      return `${user.name} ${user.lastName}`;
    }
    const client = this.order().client;
    return `${client.name} ${client.lastName}`;
  });

  ngOnInit() {
    this.document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    this.document.body.style.overflow = '';
  }

  onClose() {
    this.close.emit();
  }

  getClientEmailLink(): string {
    const clientEmail = this.order().client.email;
    const adminName = this.currentUserName();
    const orderId = this.order().id;
    const subject = `Consulta sobre el pedido #${orderId} - LaElsi`;
    const body = `Hola, soy ${adminName}, de la librería LaElsi. Quisiera preguntarle con respecto al pedido de ID ${orderId}.`;

    return `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  getStoreWhatsappLink(type: 'comprobante' | 'consulta'): string {
    const storePhone = '5493417121860';
    const userName = this.currentUserName();
    const orderId = this.order().id;

    let message = '';
    if (type === 'comprobante') {
      message = `Hola, soy ${userName}, te adjunto el comprobante del pedido de ID ${orderId}.`;
    } else {
      message = `Hola, soy ${userName}, tengo una consulta con respecto a mi pedido de ID ${orderId}.`;
    }

    return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
  }

  getClientWhatsappLink(): string {
    const clientPhone = this.order().client.phone.replace(/\D/g, '');
    const adminName = this.currentUserName();
    const orderId = this.order().id;
    const message = `Hola, soy ${adminName}, de la librería LaElsi. Quisiera preguntarle con respecto al pedido de ID ${orderId}.`;

    return `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`;
  }
}
