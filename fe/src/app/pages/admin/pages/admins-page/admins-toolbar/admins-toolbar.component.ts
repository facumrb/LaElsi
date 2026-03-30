import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchInputComponent } from '@admin/components/inputs/search-input/search-input.component';

import { CreateEntityButtonComponent } from '@admin/components/toolbar-components/create-entity-button/create-entity-button.component';

@Component({
  selector: 'app-admins-toolbar',
  imports: [FormsModule, SearchInputComponent, CreateEntityButtonComponent],
  templateUrl: './admins-toolbar.component.html',
})
export class AdminsToolbarComponent {
  searchQuery = model.required<string>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();
}
