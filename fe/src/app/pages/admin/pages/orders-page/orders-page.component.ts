import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { IApiOrder, OrderState, DeliveryMethod } from '@models/order.model';
import { ApiOrderService } from '@services/api-order.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { OrdersListComponent } from './orders-list/orders-list.component';
import { OrdersToolbarComponent } from './orders-toolbar/orders-toolbar.component';

@Component({
  selector: 'app-orders-page',
  imports: [OrdersListComponent, OrdersToolbarComponent],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent implements OnInit {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _orderService = inject(ApiOrderService);

  private ordersRaw = signal<IApiOrder[]>([]);
  searchQuery = signal<string>('');

  ordersFiltered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const orders = this.ordersRaw();

    if (!query) return orders.sort((a, b) => b.id - a.id);

    return orders
      .filter((order) => {
        const clientName =
          `${order.client.name} ${order.client.lastName}`.toLowerCase();
        return (
          clientName.includes(query) ||
          order.id.toString().includes(query) ||
          order.status.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.id - a.id);
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
