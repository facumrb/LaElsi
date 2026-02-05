import { Component, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPencilSquare,
  bootstrapTrash,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-table-actions',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ bootstrapPencilSquare, bootstrapTrash })],
  templateUrl: './table-actions.component.html',
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class TableActionsComponent<T> {
  // Recibimos el objeto genérico (Product, Category, Admin, Client, etc.)
  item = input.required<T>();

  onEdit = output<T>();
  onDelete = output<T>();
}

/* Ejemplo de uso en un componente padre:

<td class="block px-6 py-4 md:table-cell align-middle">
  <app-table-actions
      [item]="product"
      (onEdit)="onEdit.emit($event)"
      (onDelete)="onDelete.emit($event)"
  />
</td>
*/
