import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { IApiOrder, OrderState, DeliveryMethod } from '@models/order.model';
import { ApiOrderService } from '@services/api-order.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { OrdersListComponent } from './orders-list/orders-list.component';
import {
  OrdersToolbarComponent,
  OrderStatusFilter,
  DeliveryMethodFilter,
} from './orders-toolbar/orders-toolbar.component';
import { OrderDetailModalComponent } from '@shared/components/order-detail-modal/order-detail-modal.component';

@Component({
  selector: 'app-orders-page',
  imports: [
    OrdersListComponent,
    OrdersToolbarComponent,
    OrderDetailModalComponent,
  ],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent implements OnInit {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _orderService = inject(ApiOrderService);

  private ordersRaw = signal<IApiOrder[]>([]);
  searchQuery = signal<string>('');
  statusFilter = signal<OrderStatusFilter>('Todos');
  deliveryMethodFilter = signal<DeliveryMethodFilter>('Todos');
  selectedOrderForModal = signal<IApiOrder | null>(null);

  filtersActive = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'Todos' ||
      this.deliveryMethodFilter() !== 'Todos'
    );
  });

  ordersFiltered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const delivery = this.deliveryMethodFilter();
    const orders = this.ordersRaw();

    let filtered = orders.filter((order) => {
      // Filtro de Búsqueda
      let matchesSearch = true;
      if (query) {
        const clientName =
          `${order.client.name} ${order.client.lastName}`.toLowerCase();
        matchesSearch =
          clientName.includes(query) ||
          order.id.toString().includes(query) ||
          order.status.toLowerCase().includes(query) ||
          order.paymentMethod.toLowerCase().includes(query);
      }

      // Filtro de Estado
      const matchesStatus = status === 'Todos' || order.status === status;

      // Filtro de Delivery
      const matchesDelivery =
        delivery === 'Todos' || order.deliveryMethod === delivery;

      return matchesSearch && matchesStatus && matchesDelivery;
    });

    // Ordenamiento por defecto: más recientes primero
    return filtered.sort((a, b) => b.id - a.id);
  });

  ngOnInit() {
    this.loadOrders();
  }
  loadOrders() {
    this._orderService.getAllOrders().subscribe({
      next: (data) => {
        this.ordersRaw.set(data);
      },
      error: (err) => {
        this._errorService.handle(err, 'cargar las órdenes');
      },
    });
  }

  openOrderDetail(order: IApiOrder) {
    this.selectedOrderForModal.set(order);
  }

  closeOrderDetail() {
    this.selectedOrderForModal.set(null);
  }

  handleUpdateStatus(event: { id: number; status: OrderState }) {
    this._orderService.updateStatus(event.id, event.status).subscribe({
      next: (updatedOrder) => {
        this._alertService.toast(
          `Orden #${event.id} pasó a ${event.status}`,
          'success',
        );
        this.updateOrderInList(updatedOrder);
      },
      error: (err) => {
        this._errorService.handle(err, 'actualizar el estado de la orden');
      },
    });
  }

  handleUpdateDelivery(event: { id: number; method: DeliveryMethod }) {
    this._orderService.updateDeliveryMethod(event.id, event.method).subscribe({
      next: (updatedOrder) => {
        this._alertService.toast(
          `Método actualizado a "${event.method}"`,
          'success',
        );
        this.updateOrderInList(updatedOrder);
      },
      error: (err) => {
        this._errorService.handle(err, 'actualizar el método de entrega');
      },
    });
  }

  handleCancel(id: number) {
    this._alertService
      .confirmDelete(
        'Esta acción cancelará la orden y restaurará el stock de los productos.',
      )
      .then((confirm) => {
        if (confirm) {
          this._orderService.cancelOrder(id).subscribe({
            next: (updatedOrder) => {
              this._alertService.toast(
                'Orden cancelada correctamente',
                'success',
              );
              this.updateOrderInList(updatedOrder);
            },
            error: (err) => {
              this._errorService.handle(err, 'cancelar la orden');
            },
          });
        }
      });
  }

  private updateOrderInList(updatedOrder: IApiOrder) {
    this.ordersRaw.update((current) =>
      current.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    );
  }
}
