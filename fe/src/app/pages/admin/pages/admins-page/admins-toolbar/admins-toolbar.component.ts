import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPlusLg,
  bootstrapSearch,
  bootstrapX,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-admins-toolbar',
  imports: [NgIconComponent, FormsModule],
  viewProviders: provideIcons({
    bootstrapPlusLg,
    bootstrapSearch,
    bootstrapX,
  }),
  templateUrl: './admins-toolbar.component.html',
})
export class AdminsToolbarComponent {
  searchQuery = model.required<string>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();
}
