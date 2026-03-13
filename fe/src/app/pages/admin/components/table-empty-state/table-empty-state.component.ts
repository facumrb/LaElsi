import { Component, input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapInbox } from '@ng-icons/bootstrap-icons';

@Component({
  selector: '[app-table-empty-state]',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ bootstrapSearch, bootstrapInbox })],
  templateUrl: './table-empty-state.component.html',
})
export class TableEmptyStateComponent {
  colspan = input.required<number>();
  isFilterActive = input.required<boolean>();
  emptyMessage = input.required<string>();
  searchMessage = input<string>('No se encontraron resultados');
}
