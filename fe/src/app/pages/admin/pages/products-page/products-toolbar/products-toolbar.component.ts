import { Component, input, model, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapCurrencyDollar } from '@ng-icons/bootstrap-icons';
import { CreateEntityButtonComponent } from '@admin/components/toolbar-components/create-entity-button/create-entity-button.component';
import { ProductsSearchBarComponent } from './components/products-search-bar/products-search-bar.component';
import { ProductsFilterButtonComponent } from './components/products-filter-button/products-filter-button.component';

export type StockFilter =
  | 'Todos'
  | 'AltoStock' // Productos con stock > 10
  | 'BajoStock' // Productos con stock <= 10
  | 'SinStock' // Productos con stock = 0
  | 'MasProductos' // Productos de Mayor a menor stock
  | 'MenosProductos'; // Productos de Menor a mayor stock

export type StatusFilter = 'Todos' | 'Activo' | 'Inactivo';

export interface SimpleCategory {
  id: number;
  name: string;
}

@Component({
  selector: 'app-products-toolbar',
  imports: [
    NgIconComponent,
    CreateEntityButtonComponent,
    ProductsSearchBarComponent,
    ProductsFilterButtonComponent,
  ],
  viewProviders: provideIcons({
    bootstrapCurrencyDollar,
  }),
  templateUrl: './products-toolbar.component.html',
})
export class ProductsToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();
  hasSelection = input<boolean>(false);

  // Output para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();

  onBulkPriceUpdate = output<void>();

  categoryFilter = model.required<number | 'Todos'>();
  categories = input.required<SimpleCategory[]>();
}
