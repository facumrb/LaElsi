import { Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPlusLg,
  bootstrapSearch,
  bootstrapX,
  bootstrapFunnel,
  bootstrapFunnelFill,
} from '@ng-icons/bootstrap-icons';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FiscalCondition } from '@models/user.model';

export type FiscalConditionFilter = FiscalCondition | 'Todos';

@Component({
  selector: 'app-clients-toolbar',
  imports: [NgIconComponent, FormsModule, ClickOutsideDirective],
  viewProviders: provideIcons({
    bootstrapPlusLg,
    bootstrapSearch,
    bootstrapX,
    bootstrapFunnel,
    bootstrapFunnelFill,
  }),
  templateUrl: './clients-toolbar.component.html',
})
export class ClientsToolbarComponent {
  searchQuery = model.required<string>();
  fiscalFilter = model.required<FiscalConditionFilter>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();

  showFilterMenu = signal(false);

  readonly FiscalCondition = FiscalCondition;

  toggleMenu() {
    this.showFilterMenu.set(!this.showFilterMenu());
  }

  hayFiltrosActivos() {
    return this.fiscalFilter() !== 'Todos';
  }

  limpiar() {
    this.fiscalFilter.set('Todos');
    this.searchQuery.set('');
    this.showFilterMenu.set(false);
  }
}
