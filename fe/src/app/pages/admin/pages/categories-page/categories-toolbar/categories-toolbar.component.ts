import { Component, output, model, signal } from '@angular/core';
import { CreateEntityButtonComponent } from '@admin/components/toolbar-components/create-entity-button/create-entity-button.component';
import { ToolbarTitleComponent } from '@admin/components/toolbar-components/toolbar-title/toolbar-title.component';
import { CategoriesOrderModalComponent } from './components/categories-order-modal/categories-order-modal.component';
import { SearchInputComponent } from '@admin/components/toolbar-components/search-input/search-input.component';
import { CategoriesFilterButtonComponent } from './components/categories-filter-button/categories-filter-button.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapArrowDownUp } from '@ng-icons/bootstrap-icons';

export type StockFilter =
  | 'Todos'
  | 'ConProductos'
  | 'SinProductos'
  | 'MasProductos'
  | 'MenosProductos';

export type StatusFilter = 'Todos' | 'Activo' | 'Inactivo';

@Component({
  selector: 'app-categories-toolbar',
  imports: [
    ToolbarTitleComponent,
    CreateEntityButtonComponent,
    CategoriesOrderModalComponent,
    SearchInputComponent,
    CategoriesFilterButtonComponent,
    NgIconComponent,
  ],
  providers: [provideIcons({ bootstrapArrowDownUp })],
  templateUrl: './categories-toolbar.component.html',
})
export class CategoriesToolbarComponent {
  searchQuery = model.required<string>();
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();

  // OUTPUT: Para avisar que el orden ha cambiado
  onOrderChange = output<void>();

  showOrderModal = signal(false);
}
