import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPlusLg,
  bootstrapSearch,
  bootstrapX,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-clients-toolbar',
  imports: [NgIconComponent, FormsModule],
  viewProviders: provideIcons({
    bootstrapPlusLg,
    bootstrapSearch,
    bootstrapX,
  }),
  templateUrl: './clients-toolbar.component.html',
})
export class ClientsToolbarComponent {
  searchQuery = model.required<string>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();
}
