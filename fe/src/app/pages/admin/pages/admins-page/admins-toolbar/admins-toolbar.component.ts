import { Component, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPlusLg } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-admins-toolbar',
  imports: [NgIconComponent],
  viewProviders: provideIcons({
    bootstrapPlusLg,
  }),
  templateUrl: './admins-toolbar.component.html',
})
export class AdminsToolbarComponent {
  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();
}
