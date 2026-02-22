import { Component, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapClockHistory,
  bootstrapBoxSeam,
  bootstrapCheckCircle,
  bootstrapXCircle,
} from '@ng-icons/bootstrap-icons';
import { IApiOrder, OrderState } from '@models/order.model';
import { environment } from 'src/environments/environment';
import { OrderDetailModalComponent } from '@shared/components/order-detail-modal/order-detail-modal.component';

@Component({
  selector: 'app-profile-orders',
  imports: [
    NgIconComponent,
    CurrencyPipe,
    DatePipe,
    OrderDetailModalComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapClockHistory,
      bootstrapBoxSeam,
      bootstrapCheckCircle,
      bootstrapXCircle,
    }),
  ],
  templateUrl: './profile-orders.component.html',
})
export class ProfileOrdersComponent {
  orders = input<IApiOrder[]>([]);
  productImagesUrl = environment.productImagesUrl;

  selectedOrder = signal<IApiOrder | null>(null);

  openModal(order: IApiOrder) {
    this.selectedOrder.set(order);
  }

  closeModal() {
    this.selectedOrder.set(null);
  }

  getStatusClass(status: OrderState | string): string {
    switch (status) {
      case 'Pendiente':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Pagado':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Entregado':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelado':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }
}
