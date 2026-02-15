import { Component, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSearch,
  bootstrapX,
  bootstrapFunnel,
  bootstrapFunnelFill,
  bootstrapPlusLg,
  bootstrapCurrencyDollar,
} from '@ng-icons/bootstrap-icons';

export type StockFilter =
  | 'Todos'
  | 'AltoStock' // Productos con stock > 10
  | 'BajoStock' // Productos con stock <= 10
  | 'SinStock' // Productos con stock = 0
  | 'MasProductos' // Productos de Mayor a menor stock
  | 'MenosProductos'; // Productos de Menor a mayor stock

export type StatusFilter = 'Todos' | 'Activo' | 'Inactivo';

@Component({
  selector: 'app-products-toolbar',
  imports: [FormsModule, ClickOutsideDirective, NgIconComponent],
  viewProviders: provideIcons({
    bootstrapSearch,
    bootstrapX,
    bootstrapFunnel,
    bootstrapFunnelFill,
    bootstrapPlusLg,
    bootstrapCurrencyDollar,
  }),
  templateUrl: './products-toolbar.component.html',
})
export class ProductsToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();
  hasSelection = input<boolean>(false);

  // OUTPUTS
  onAdd = output<void>();
  onBulkPriceUpdate = output<void>();

  showFilterMenu = signal(false);
  toggleMenu() {
    this.showFilterMenu.set(!this.showFilterMenu());
  }

  hayFiltrosActivos() {
    return this.statusFilter() !== 'Todos' || this.stockFilter() !== 'Todos';
  }

  limpiar() {
    this.statusFilter.set('Todos');
    this.stockFilter.set('Todos');
    this.searchQuery.set('');
    this.showFilterMenu.set(false);
  }
}
