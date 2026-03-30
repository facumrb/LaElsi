import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCurrencyDollar,
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { SearchInputComponent } from '@admin/components/inputs/search-input/search-input.component';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';
import { CreateEntityButtonComponent } from '@admin/components/toolbar-components/create-entity-button/create-entity-button.component';

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
    FormsModule,
    ClickOutsideDirective,
    NgIconComponent,
    SearchInputComponent,
    FilterButtonComponent,
    CreateEntityButtonComponent,
  ],
  viewProviders: provideIcons({
    bootstrapCurrencyDollar,
    bootstrapChevronDown,
    bootstrapCheckLg,
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

  showFilterMenu = signal(false);

  categoryFilter = model.required<number | 'Todos'>();
  categories = input.required<SimpleCategory[]>();
  showCategoryMenu = signal(false);

  selectedCategoryName = computed(() => {
    const selected = this.categoryFilter();
    if (selected === 'Todos') {
      return 'Todas las categorías';
    }
    // Buscamos el nombre en el array de categorías
    const cat = this.categories().find((c) => c.id === selected);
    return cat ? cat.name : 'Categoría desconocida';
  });

  selectCategory(val: number | 'Todos') {
    this.categoryFilter.set(val);
    this.showCategoryMenu.set(false);
  }

  hayFiltrosActivos() {
    return (
      this.statusFilter() !== 'Todos' ||
      this.stockFilter() !== 'Todos' ||
      this.categoryFilter() !== 'Todos'
    );
  }

  limpiar() {
    this.statusFilter.set('Todos');
    this.stockFilter.set('Todos');
    this.categoryFilter.set('Todos');
    this.searchQuery.set('');
    this.showFilterMenu.set(false);
  }

  onCategoryChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    // Si es "Todos" pasamos el string, si es número lo parseamos
    this.categoryFilter.set(val === 'Todos' ? 'Todos' : Number(val));
  }
}
