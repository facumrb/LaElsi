import { Component, input, signal, inject, output } from '@angular/core';
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
import { ApiOrderService } from '@services/api-order.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';

@Component({
  selector: 'app-profile-orders',
  imports: [NgIconComponent, CurrencyPipe, DatePipe, OrderDetailModalComponent],
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
  private orderService = inject(ApiOrderService);
  private alertService = inject(AlertService);
  private errorService = inject(ApiErrorService);
  profileUpdated = output<void>();

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

  handleCancel(id: number) {
    this.alertService
      .confirmDelete('¿Estás seguro que deseas cancelar tu pedido?')
      .then((confirm) => {
        if (confirm) {
          this.orderService.cancelOrder(id).subscribe({
            next: () => {
              this.alertService.toast(
                'Pedido cancelado correctamente',
                'success',
              );
              this.profileUpdated.emit();
              this.closeModal();
            },
            error: (err) => {
              this.errorService.handle(err, 'cancelar el pedido');
            },
          });
        }
      });
  }
}
