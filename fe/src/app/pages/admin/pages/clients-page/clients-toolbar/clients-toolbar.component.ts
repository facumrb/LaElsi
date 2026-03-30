import { Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FiscalCondition } from '@models/user.model';
import { SearchInputComponent } from '@admin/components/inputs/search-input/search-input.component';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';
import { CreateEntityButtonComponent } from '@admin/components/toolbar-components/create-entity-button/create-entity-button.component';

export type FiscalConditionFilter = FiscalCondition | 'Todos';

@Component({
  selector: 'app-clients-toolbar',
  imports: [
    FormsModule,
    ClickOutsideDirective,
    SearchInputComponent,
    FilterButtonComponent,
    CreateEntityButtonComponent,
  ],
  templateUrl: './clients-toolbar.component.html',
})
export class ClientsToolbarComponent {
  searchQuery = model.required<string>();
  fiscalFilter = model.required<FiscalConditionFilter>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();

  showFilterMenu = signal(false);

  readonly FiscalCondition = FiscalCondition;

  hayFiltrosActivos() {
    return this.fiscalFilter() !== 'Todos';
  }

  limpiar() {
    this.fiscalFilter.set('Todos');
    this.searchQuery.set('');
    this.showFilterMenu.set(false);
  }
}
