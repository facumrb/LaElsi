import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapInbox } from '@ng-icons/bootstrap-icons';

@Component({
  selector: '[app-table-empty-state]',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ bootstrapSearch, bootstrapInbox })],
  templateUrl: './table-empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableEmptyStateComponent {
  // Número de columnas que ocupará la tabla
  colspan = input.required<number>();

  // Indica si hay filtros aplicados para cambiar el icono y el mensaje
  isFilterActive = input.required<boolean>();

  // Mensaje mostrado cuando entidad todavia no tiene datos cargados
  emptyMessage = input.required<string>();

  // Mensaje mostrado cuando la búsqueda/filtros no arroja resultados
  searchMessage = input<string>('No se encontraron resultados');
}
