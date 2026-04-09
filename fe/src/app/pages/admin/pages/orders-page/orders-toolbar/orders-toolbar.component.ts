import { Component, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { OrderState, DeliveryMethod, PaymentMethod } from '@models/order.model';
import { SearchInputComponent } from '@admin/components/toolbar-components/search-input/search-input.component';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';
import { ToolbarTitleComponent } from '@admin/components/toolbar-components/toolbar-title/toolbar-title.component';

export type OrderStatusFilter = OrderState | 'Todos';
export type DeliveryMethodFilter = DeliveryMethod | 'Todos';
export type PaymentMethodFilter = PaymentMethod | 'Todos';

@Component({
  selector: 'app-orders-toolbar',
  imports: [
    ToolbarTitleComponent,
    FormsModule,
    ClickOutsideDirective,
    SearchInputComponent,
    FilterButtonComponent,
  ],
  templateUrl: './orders-toolbar.component.html',
})
export class OrdersToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<OrderStatusFilter>();
  deliveryMethodFilter = model.required<DeliveryMethodFilter>();
  paymentMethodFilter = model.required<PaymentMethodFilter>();

  showFilterMenu = signal(false);

  readonly OrderState = OrderState;
  readonly DeliveryMethod = DeliveryMethod;
  readonly PaymentMethod = PaymentMethod;

  hayFiltrosActivos() {
    return (
      this.statusFilter() !== 'Todos' ||
      this.deliveryMethodFilter() !== 'Todos' ||
      this.paymentMethodFilter() !== 'Todos'
    );
  }

  limpiar() {
    this.statusFilter.set('Todos');
    this.deliveryMethodFilter.set('Todos');
    this.paymentMethodFilter.set('Todos');
    this.searchQuery.set('');
    this.showFilterMenu.set(false);
  }
}
