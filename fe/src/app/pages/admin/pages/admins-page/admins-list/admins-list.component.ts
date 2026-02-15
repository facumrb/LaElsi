import { Component, input, output } from '@angular/core';
import { TableActionsComponent } from '@admin/components/table-actions/table-actions.component';
import { IApiAdmin } from '@models/user.model';
import { environment } from 'src/environments/environment';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSearch,
  bootstrapInbox,
  bootstrapEnvelope,
  bootstrapTelephone,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-admins-list',
  imports: [TableActionsComponent, NgIconComponent],
  viewProviders: provideIcons({
    bootstrapSearch,
    bootstrapInbox,
    bootstrapEnvelope,
    bootstrapTelephone,
  }),
  templateUrl: './admins-list.component.html',
})
export class AdminsListComponent {
  admins = input.required<IApiAdmin[]>();
  onEdit = output<IApiAdmin>();
  onDelete = output<IApiAdmin>();

  // Como no hay filtros aún en el toolbar, esto podría venir siempre false, pero lo dejamos listo para el futuro.
  isFilterActive = input<boolean>(false);

  readonly imageBaseUrl = environment.userImagesUrl;

  getInitials(admin: IApiAdmin): string {
    const first = admin.name?.charAt(0) || '';
    const last = admin.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}
