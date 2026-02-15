import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IApiOrder, OrderState, DeliveryMethod } from '@models/order.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSearch,
  bootstrapInbox,
  bootstrapTruck,
  bootstrapShop,
  bootstrapCheckCircle,
  bootstrapXCircle,
  bootstrapClock,
  bootstrapCheck2All,
  bootstrapArrowRight,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-orders-list',
  imports: [CommonModule, NgIconComponent],
  viewProviders: provideIcons({
    bootstrapSearch,
    bootstrapInbox,
    bootstrapTruck,
    bootstrapShop,
    bootstrapCheckCircle,
    bootstrapXCircle,
    bootstrapClock,
    bootstrapCheck2All,
    bootstrapArrowRight,
  }),
  templateUrl: './orders-list.component.html',
})
export class OrdersListComponent {
  orders = input.required<IApiOrder[]>();
  isFilterActive = input<boolean>(false);

  onUpdateStatus = output<{ id: number; status: OrderState }>();
  onUpdateDelivery = output<{ id: number; method: DeliveryMethod }>();
  onCancel = output<number>();

  OrderState = OrderState;
  DeliveryMethod = DeliveryMethod;

  getStatusColor(status: OrderState): string {
    switch (status) {
      case OrderState.PENDING:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case OrderState.PAID:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderState.SHIPPED:
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case OrderState.DELIVERED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case OrderState.CANCELLED:
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getStatusIcon(status: OrderState): string {
    switch (status) {
      case OrderState.PENDING:
        return 'bootstrapClock';
      case OrderState.PAID:
        return 'bootstrapCheckCircle';
      case OrderState.SHIPPED:
        return 'bootstrapTruck';
      case OrderState.DELIVERED:
        return 'bootstrapCheck2All';
      case OrderState.CANCELLED:
        return 'bootstrapXCircle';
      default:
        return 'bootstrapInbox';
    }
  }

  getNextStates(order: IApiOrder): OrderState[] {
    if (
      order.status === OrderState.CANCELLED ||
      order.status === OrderState.DELIVERED
    ) {
      return [];
    }

    if (order.deliveryMethod === DeliveryMethod.ENVIO) {
      switch (order.status) {
        case OrderState.PENDING:
          return [OrderState.PAID];
        case OrderState.PAID:
          return [OrderState.SHIPPED];
        case OrderState.SHIPPED:
          return [OrderState.DELIVERED];
        default:
          return [];
      }
    } else {
      switch (order.status) {
        case OrderState.PENDING:
          return [OrderState.PAID];
        case OrderState.PAID:
          return [OrderState.DELIVERED];
        default:
          return [];
      }
    }
  }

  canTranslateDelivery(order: IApiOrder): boolean {
    return [OrderState.PENDING, OrderState.PAID].includes(order.status);
  }
}
