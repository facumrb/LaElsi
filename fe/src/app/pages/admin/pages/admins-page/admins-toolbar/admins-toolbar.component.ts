import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPlusLg,
} from '@ng-icons/bootstrap-icons';
import { SearchInputComponent } from '@shared/components/inputs/search-input/search-input.component';

@Component({
  selector: 'app-admins-toolbar',
  imports: [NgIconComponent, FormsModule, SearchInputComponent],
  viewProviders: provideIcons({
    bootstrapPlusLg,
  }),
  templateUrl: './admins-toolbar.component.html',
})
export class AdminsToolbarComponent {
  searchQuery = model.required<string>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();
}
