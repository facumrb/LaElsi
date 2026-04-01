import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableActionsComponent<T> {
  // Recibimos el objeto genérico (Product, Category, Admin, Client, etc.)
  item = input.required<T>();

  onEdit = output<T>();
  onDelete = output<T>();
}
