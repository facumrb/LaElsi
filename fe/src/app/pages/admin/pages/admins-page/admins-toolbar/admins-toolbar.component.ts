import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchInputComponent } from '@admin/components/toolbar-components/search-input/search-input.component';

import { CreateEntityButtonComponent } from '@admin/components/toolbar-components/create-entity-button/create-entity-button.component';
import { ToolbarTitleComponent } from '@admin/components/toolbar-components/toolbar-title/toolbar-title.component';

@Component({
  selector: 'app-admins-toolbar',
  imports: [
    ToolbarTitleComponent,
    FormsModule,
    SearchInputComponent,
    CreateEntityButtonComponent,
  ],
  templateUrl: './admins-toolbar.component.html',
})
export class AdminsToolbarComponent {
  searchQuery = model.required<string>();

  // OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();
}
