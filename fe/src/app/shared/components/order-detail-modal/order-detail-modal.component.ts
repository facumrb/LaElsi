import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  inject,
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
  productImagesUrl = environment.productImagesUrl;

  ngOnInit() {
    this.document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    this.document.body.style.overflow = '';
  }

  onClose() {
    this.close.emit();
  }

  getWhatsappLink(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  }
}
