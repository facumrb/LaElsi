import { Component, output, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPlusLg,
} from '@ng-icons/bootstrap-icons';
import { SearchInputComponent } from '@shared/components/inputs/search-input/search-input.component';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';

export type StockFilter =
  | 'Todos'
  | 'ConProductos'
  | 'SinProductos'
  | 'MasProductos'
  | 'MenosProductos';

export type StatusFilter = 'Todos' | 'Activo' | 'Inactivo';

@Component({
  selector: 'app-categories-toolbar',
  imports: [FormsModule, ClickOutsideDirective, NgIconComponent, SearchInputComponent, FilterButtonComponent],
  viewProviders: provideIcons({
    bootstrapPlusLg,
  }),
  templateUrl: './categories-toolbar.component.html',
})
export class CategoriesToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();

  showFilterMenu = signal(false);

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
