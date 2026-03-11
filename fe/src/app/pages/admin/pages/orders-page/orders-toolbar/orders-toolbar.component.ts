import { Component, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapFunnel,
  bootstrapFunnelFill,
} from '@ng-icons/bootstrap-icons';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { OrderState, DeliveryMethod } from '@models/order.model';
import { SearchInputComponent } from '@shared/components/inputs/search-input/search-input.component';

export type OrderStatusFilter = OrderState | 'Todos';
export type DeliveryMethodFilter = DeliveryMethod | 'Todos';

@Component({
  selector: 'app-orders-toolbar',
  imports: [NgIconComponent, FormsModule, ClickOutsideDirective, SearchInputComponent],
  viewProviders: provideIcons({
    bootstrapFunnel,
    bootstrapFunnelFill,
  }),
  templateUrl: './orders-toolbar.component.html',
})
export class OrdersToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<OrderStatusFilter>();
  deliveryMethodFilter = model.required<DeliveryMethodFilter>();

  showFilterMenu = signal(false);

  readonly OrderState = OrderState;
  readonly DeliveryMethod = DeliveryMethod;

  toggleMenu() {
    this.showFilterMenu.set(!this.showFilterMenu());
  }

  hayFiltrosActivos() {
    return (
      this.statusFilter() !== 'Todos' || this.deliveryMethodFilter() !== 'Todos'
    );
  }

  limpiar() {
    this.statusFilter.set('Todos');
    this.deliveryMethodFilter.set('Todos');
    this.searchQuery.set('');
    this.showFilterMenu.set(false);
  }
}
