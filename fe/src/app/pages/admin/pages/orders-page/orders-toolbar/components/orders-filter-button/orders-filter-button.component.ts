import { Component, model, signal, computed } from '@angular/core';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';
import {
  FilterAccordionComponent,
  FilterOption,
} from '@shared/components/filter-accordion/filter-accordion.component';
import { OrderState, DeliveryMethod, PaymentMethod } from '@models/order.model';

export type OrderStatusFilter = OrderState | 'Todos';
export type DeliveryMethodFilter = DeliveryMethod | 'Todos';
export type PaymentMethodFilter = PaymentMethod | 'Todos';

@Component({
  selector: 'app-orders-filter-button',
  imports: [
    ClickOutsideDirective,
    FilterButtonComponent,
    FilterAccordionComponent,
  ],
  templateUrl: './orders-filter-button.component.html',
})
export class OrdersFilterButtonComponent {
  statusFilter = model.required<OrderStatusFilter>();
  deliveryMethodFilter = model.required<DeliveryMethodFilter>();
  paymentMethodFilter = model.required<PaymentMethodFilter>();

  showFilterMenu = signal(false);

  readonly statusOptions: FilterOption[] = [
    { value: 'Todos', label: 'Todos' },
    { value: OrderState.Pending, label: 'Pendiente' },
    { value: OrderState.Paid, label: 'Pagado' },
    { value: OrderState.Shipped, label: 'Enviado' },
    { value: OrderState.Delivered, label: 'Entregado' },
    { value: OrderState.Cancelled, label: 'Cancelado' },
  ];

  readonly deliveryOptions: FilterOption[] = [
    { value: 'Todos', label: 'Todos' },
    { value: DeliveryMethod.Envio, label: 'Envío' },
    { value: DeliveryMethod.RetiroSucursal, label: 'Retiro en sucursal' },
  ];

  readonly paymentOptions: FilterOption[] = [
    { value: 'Todos', label: 'Todos' },
    { value: PaymentMethod.Transferencia, label: 'Transferencia' },
    { value: PaymentMethod.Local, label: 'Local' },
  ];

  hayFiltrosActivos = computed(
    () =>
      this.statusFilter() !== 'Todos' ||
      this.deliveryMethodFilter() !== 'Todos' ||
      this.paymentMethodFilter() !== 'Todos',
  );

  limpiar(): void {
    this.statusFilter.set('Todos');
    this.deliveryMethodFilter.set('Todos');
    this.paymentMethodFilter.set('Todos');
    this.showFilterMenu.set(false);
  }
}
