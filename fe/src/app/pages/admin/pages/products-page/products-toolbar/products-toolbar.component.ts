import { Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/click-outside.directive';

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
  imports: [FormsModule, ClickOutsideDirective],
  templateUrl: './products-toolbar.component.html',
})
export class ProductsToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();

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
