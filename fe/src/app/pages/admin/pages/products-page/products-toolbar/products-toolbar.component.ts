import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type StockFilter =
  | 'Todos'
  | 'ConStock' // Productos con stock > 0
  | 'SinStock' // Productos con stock === 0
  | 'BajoStock'; // Productos con stock <= 10 (Tu regla de negocio)

@Component({
  selector: 'app-products-toolbar',
  imports: [FormsModule],
  templateUrl: './products-toolbar.component.html',
})
export class ProductsToolbarComponent {
  statusFilter = model.required<'Todos' | 'Activo' | 'Inactivo'>();
  stockFilter = model.required<StockFilter>();
  searchQuery = model.required<string>();

  // Output para el botón de crear
  onAdd = output<void>();

  showMenu = false;

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  hayFiltrosActivos() {
    return this.statusFilter() !== 'Todos' || this.stockFilter() !== 'Todos';
  }

  limpiar() {
    this.statusFilter.set('Todos');
    this.stockFilter.set('Todos');
    this.searchQuery.set('');
    this.showMenu = false;
  }
}
