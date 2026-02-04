import { Component, output, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/click-outside.directive';

export type StockFilter =
  | 'Todos'
  | 'ConProductos'
  | 'SinProductos'
  | 'MasProductos'
  | 'MenosProductos';

export type StatusFilter = 'Todos' | 'Activo' | 'Inactivo';

@Component({
  selector: 'app-categories-toolbar',
  imports: [FormsModule, ClickOutsideDirective],
  templateUrl: './categories-toolbar.component.html',
})
export class CategoriesToolbarComponent {
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
