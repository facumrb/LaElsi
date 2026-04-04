import { Component, model, signal } from '@angular/core';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';

export type StockFilter =
  | 'Todos'
  | 'ConProductos'
  | 'SinProductos'
  | 'MasProductos'
  | 'MenosProductos';

export type StatusFilter = 'Todos' | 'Activo' | 'Inactivo';

@Component({
  selector: 'app-categories-filter-button',
  imports: [ClickOutsideDirective, FilterButtonComponent],
  templateUrl: './categories-filter-button.component.html',
})
export class CategoriesFilterButtonComponent {
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();

  showFilterMenu = signal(false);

  hayFiltrosActivos() {
    return this.statusFilter() !== 'Todos' || this.stockFilter() !== 'Todos';
  }

  limpiar() {
    this.statusFilter.set('Todos');
    this.stockFilter.set('Todos');
    this.showFilterMenu.set(false);
  }
}
