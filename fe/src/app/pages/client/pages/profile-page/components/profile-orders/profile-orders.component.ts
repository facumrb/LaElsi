import { Component, input, signal, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapClockHistory,
  bootstrapBoxSeam,
  bootstrapCheckCircle,
  bootstrapXCircle,
} from '@ng-icons/bootstrap-icons';
import { IApiOrder, OrderState } from '@models/order.model';
import { OrderDetailModalComponent } from '@shared/components/modals/order-detail-modal/order-detail-modal.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { CancelOrderModalComponent } from '@shared/components/modals/cancel-order-modal/cancel-order-modal.component';

@Component({
  selector: 'app-profile-orders',
  imports: [
    NgIconComponent,
    CurrencyPipe,
    FormatDatePipe,
    OrderDetailModalComponent,
    PaginationComponent,
    CancelOrderModalComponent,
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
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  pageChange = output<number>();
  profileUpdated = output<void>();

  selectedOrder = signal<IApiOrder | null>(null);
  orderIdToCancel = signal<number | null>(null);

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
      case 'Enviado':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelado':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  handleCancel(id: number) {
    this.orderIdToCancel.set(id);
  }

  handleOrderCancelled() {
    this.orderIdToCancel.set(null);
    this.closeModal();
    this.profileUpdated.emit();
  }

  onPageChange(page: number) {
    this.pageChange.emit(page);
  }
}
