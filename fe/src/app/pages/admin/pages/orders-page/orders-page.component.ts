import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { IApiOrder, OrderState, DeliveryMethod } from '@models/order.model';
import { ApiOrderService } from '@services/api-services/api-order.service';
import { AlertService } from '@services/alert.service';
import { OrdersListComponent } from './orders-list/orders-list.component';
import {
  OrdersToolbarComponent,
  OrderStatusFilter,
  DeliveryMethodFilter,
  PaymentMethodFilter,
} from './orders-toolbar/orders-toolbar.component';
import { OrderDetailModalComponent } from '@shared/components/order-detail-modal/order-detail-modal.component';
import { Router, ActivatedRoute } from '@angular/router';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  selector: 'app-orders-page',
  imports: [
    OrdersListComponent,
    OrdersToolbarComponent,
    OrderDetailModalComponent,
    PaginationComponent,
  ],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private orderService = inject(ApiOrderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private ordersRaw = signal<IApiOrder[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);

  searchQuery = signal<string>('');
  statusFilter = signal<OrderStatusFilter>('Todos');
  deliveryMethodFilter = signal<DeliveryMethodFilter>('Todos');
  paymentMethodFilter = signal<PaymentMethodFilter>('Todos');
  selectedOrderForModal = signal<IApiOrder | null>(null);

  filtersActive = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'Todos' ||
      this.deliveryMethodFilter() !== 'Todos' ||
      this.paymentMethodFilter() !== 'Todos'
    );
  });

  // Los datos ya vienen filtrados y ordenados del server
  ordersFiltered = computed(() => [...this.ordersRaw()]);

  private initialLoadDone = false;

  constructor() {
    // Al cambiar cualquier filtro, resetear a página 1 y recargar del server
    effect(() => {
      this.searchQuery();
      this.statusFilter();
      this.deliveryMethodFilter();
      this.paymentMethodFilter();
      untracked(() => {
        if (this.initialLoadDone) {
          this.currentPage.set(1);
          this.loadOrders();
        }
      });
    });
  }

  ngOnInit() {
    const pageParam = this.route.snapshot.queryParamMap.get('page');
    this.currentPage.set(Number(pageParam) || 1);
    this.loadOrders();
    this.initialLoadDone = true;
  }

  loadOrders() {
    const filters = {
      query: this.searchQuery(),
      status: this.statusFilter(),
      deliveryMethod: this.deliveryMethodFilter(),
      paymentMethod: this.paymentMethodFilter(),
    };

    this.orderService.getAllOrders(this.currentPage(), 10, filters).subscribe({
      next: (data) => {
        this.ordersRaw.set(data.data);
        this.totalPages.set(data.totalPages);
      },
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
    this.loadOrders();
  }

  openOrderDetail(order: IApiOrder) {
    this.selectedOrderForModal.set(order);
  }

  closeOrderDetail() {
    this.selectedOrderForModal.set(null);
  }

  handleUpdateStatus(event: { id: number; status: OrderState }) {
    this.orderService.updateStatus(event.id, event.status).subscribe({
      next: (updatedOrder) => {
        this.alertService.toast(
          `Orden #${event.id} pasó a ${event.status}`,
          'success',
        );
        this.updateOrderInList(updatedOrder);
      },
    });
  }

  handleUpdateDelivery(event: { id: number; method: DeliveryMethod }) {
    this.orderService.updateDeliveryMethod(event.id, event.method).subscribe({
      next: (updatedOrder) => {
        this.alertService.toast(
          `Método actualizado a "${event.method}"`,
          'success',
        );
        this.updateOrderInList(updatedOrder);
      },
    });
  }

  handleCancel(id: number) {
    this.alertService
      .confirmDelete(
        'Esta acción cancelará la orden y restaurará el stock de los productos.',
      )
      .then((confirm) => {
        if (confirm) {
          this.orderService.cancelOrder(id).subscribe({
            next: (updatedOrder) => {
              this.alertService.toast(
                'Orden cancelada correctamente',
                'success',
              );
              this.updateOrderInList(updatedOrder);
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
