import { Component, input, output } from '@angular/core';
import { TableActionsComponent } from '@admin/components/table-actions/table-actions.component';
import { IApiClient } from '@models/user.model';
import { environment } from 'src/environments/environment';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapEnvelope,
  bootstrapTelephone,
} from '@ng-icons/bootstrap-icons';

import { TableEmptyStateComponent } from '@admin/components/table-empty-state/table-empty-state.component';

@Component({
  selector: 'app-clients-list',
  imports: [TableActionsComponent, NgIconComponent, TableEmptyStateComponent],
  viewProviders: provideIcons({
    bootstrapEnvelope,
    bootstrapTelephone,
  }),
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent {
  clients = input.required<IApiClient[]>();
  onEdit = output<IApiClient>();
  onDelete = output<IApiClient>();

  // Como no hay filtros aún en el toolbar, esto podría venir siempre false, pero lo dejamos listo para el futuro.
  isFilterActive = input<boolean>(false);

  readonly imageBaseUrl = environment.userImagesUrl;

  getInitials(client: IApiClient): string {
    const first = client.name?.charAt(0) || '';
    const last = client.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  // Función para determinar el color segun la condición fiscal
  getFiscalConditionClass(condition?: string): string {
    const fiscal = condition || 'Consumidor Final';

    switch (fiscal) {
      case 'Responsable Inscripto':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'Monotributista':
        return 'bg-orange-50 text-orange-700 border-orange-200';

      case 'Exento':
        return 'bg-green-50 text-green-700 border-green-200';

      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }
}
