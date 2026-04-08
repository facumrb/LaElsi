import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { RouterModule } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxSeam,
  bootstrapPeople,
  bootstrapCart,
  bootstrapCurrencyDollar,
  bootstrapGraphUpArrow,
  bootstrapBagCheck,
  bootstrapReceipt,
} from '@ng-icons/bootstrap-icons';
import { ApiOrderService } from '@services/api-services/api-order.service';
import { ApiProductService } from '@services/api-services/api-product.service';
import { map } from 'rxjs';
import { filter, of, Subject, switchMap, tap } from 'rxjs';
import { ApiClientService } from '@services/api-services/api-client.service';
import { OrderState, IApiOrder } from '@models/order.model';
import { OrderDetailModalComponent } from '@shared/components/order-detail-modal/order-detail-modal.component';
import { ProductImageComponent } from '@shared/components/product-image/product-image.component';

@Component({
  selector: 'app-analytics-page',
  imports: [
    RouterModule,
    NgIconComponent,
    CurrencyPipe,
    FormatDatePipe,
    OrderDetailModalComponent,
    ProductImageComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapBoxSeam,
      bootstrapPeople,
      bootstrapCart,
      bootstrapCurrencyDollar,
      bootstrapGraphUpArrow,
      bootstrapBagCheck,
      bootstrapReceipt,
    }),
  ],
  templateUrl: './analytics-page.component.html',
})
export class AnalyticsPageComponent {
  private orderService = inject(ApiOrderService);
  private productService = inject(ApiProductService);
  private clientService = inject(ApiClientService);

  orders = toSignal(this.orderService.getAllOrders(), { initialValue: [] });
  products = toSignal(
    this.productService.getAllProducts().pipe(map(res => res.data)),
    { initialValue: [] }
  );
  clients = toSignal(this.clientService.getAllClients(), { initialValue: [] });

  totalRevenue = computed(() => {
    const incomesStatuses = [
      OrderState.Paid,
      OrderState.Shipped,
      OrderState.Delivered,
    ];
    return this.orders()
      .filter((o) => incomesStatuses.includes(o.status))
      .reduce((acc, order) => acc + Number(order.totalAmount || 0), 0);
  });

  totalOrders = computed(() => this.orders().length);
  totalProducts = computed(() => this.products().length);
  totalClients = computed(() => this.clients().length);

  recentOrders = computed(() => {
    return [...this.orders()].sort((a, b) => b.id - a.id).slice(0, 5);
  });

  selectedOrder = signal<IApiOrder | null>(null);

  openOrderModal(order: IApiOrder) {
    this.selectedOrder.set(order);
  }

  closeOrderModal() {
    this.selectedOrder.set(null);
  }

  bestSellingProducts = computed(() => {
    return [...this.products()]
      .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
      .slice(0, 5);
  });

  // Utils
  getOrderStatusColor(status: OrderState): string {
    switch (status) {
      case OrderState.Pending:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case OrderState.Paid:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case OrderState.Shipped:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case OrderState.Delivered:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case OrderState.Cancelled:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
