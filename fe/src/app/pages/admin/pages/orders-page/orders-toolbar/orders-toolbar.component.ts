import { Component, model } from '@angular/core';
import { SearchInputComponent } from '@admin/components/toolbar-components/search-input/search-input.component';
import { ToolbarTitleComponent } from '@admin/components/toolbar-components/toolbar-title/toolbar-title.component';
import {
  OrdersFilterButtonComponent,
  OrderStatusFilter,
  DeliveryMethodFilter,
  PaymentMethodFilter,
} from './components/orders-filter-button/orders-filter-button.component';

@Component({
  selector: 'app-orders-toolbar',
  imports: [
    ToolbarTitleComponent,
    SearchInputComponent,
    OrdersFilterButtonComponent,
  ],
  templateUrl: './orders-toolbar.component.html',
})
export class OrdersToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<OrderStatusFilter>();
  deliveryMethodFilter = model.required<DeliveryMethodFilter>();
  paymentMethodFilter = model.required<PaymentMethodFilter>();
}
