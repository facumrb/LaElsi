import { Component, EventEmitter, input, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapXLg,
  bootstrapPerson,
  bootstrapEnvelope,
  bootstrapPhone,
} from '@ng-icons/bootstrap-icons';
import { IApiOrder } from '@models/order.model';
import { environment } from 'src/environments/environment';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [NgIconComponent, CurrencyPipe, DatePipe, ClickOutsideDirective],
  viewProviders: [
    provideIcons({
      bootstrapXLg,
      bootstrapPerson,
      bootstrapEnvelope,
      bootstrapPhone,
    }),
  ],
  templateUrl: './order-detail-modal.component.html',
})
export class OrderDetailModalComponent {
  order = input.required<IApiOrder>();
  showClientInfo = input<boolean>(false); // Opcional: mostrar info de contacto del cliente
  @Output() close = new EventEmitter<void>();

  productImagesUrl = environment.productImagesUrl;

  onClose() {
    this.close.emit();
  }
}
