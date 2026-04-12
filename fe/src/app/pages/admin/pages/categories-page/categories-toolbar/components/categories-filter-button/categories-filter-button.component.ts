import { Component, model, signal, computed } from '@angular/core';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';
import {
  FilterAccordionComponent,
  FilterOption,
} from '@shared/components/filter-accordion/filter-accordion.component';

export type StockFilter =
  | 'Todos'
  | 'ConProductos'
  | 'SinProductos'
  | 'MasProductos'
  | 'MenosProductos';

export type StatusFilter = 'Todos' | 'Activo' | 'Inactivo';

@Component({
  selector: 'app-categories-filter-button',
  imports: [
    ClickOutsideDirective,
    FilterButtonComponent,
    FilterAccordionComponent,
  ],
  templateUrl: './categories-filter-button.component.html',
})
export class CategoriesFilterButtonComponent {
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();

  showFilterMenu = signal(false);

  readonly statusOptions: FilterOption[] = [
    { value: 'Todos', label: 'Todos' },
    { value: 'Activo', label: 'Activos' },
    { value: 'Inactivo', label: 'Inactivos' },
  ];

  readonly stockOptions: FilterOption[] = [
    { value: 'Todos', label: 'Todos' },
    { value: 'ConProductos', label: 'Con productos asociados' },
    { value: 'SinProductos', label: 'Sin productos asociados' },
    { value: 'MasProductos', label: 'Mayor a menor' },
    { value: 'MenosProductos', label: 'Menor a mayor' },
  ];

  hayFiltrosActivos = computed(
    () => this.statusFilter() !== 'Todos' || this.stockFilter() !== 'Todos',
  );

  limpiar() {
    this.statusFilter.set('Todos');
    this.stockFilter.set('Todos');
    this.showFilterMenu.set(false);
  }
}
