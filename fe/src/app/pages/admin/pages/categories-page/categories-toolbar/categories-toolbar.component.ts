import { Component, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type StockFilter =
  | 'Todos'
  | 'ConProductos'
  | 'SinProductos'
  | 'MasProductos'
  | 'MenosProductos';

@Component({
  selector: 'app-categories-toolbar',
  imports: [FormsModule],
  templateUrl: './categories-toolbar.component.html',
})
export class CategoriesToolbarComponent {
  statusFilter = model.required<'Todos' | 'Activo' | 'Inactivo'>();
  stockFilter = model.required<StockFilter>();
  searchQuery = model.required<string>();

  // 2. OUTPUT: Para avisar que hicieron clic en "Agregar"
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
