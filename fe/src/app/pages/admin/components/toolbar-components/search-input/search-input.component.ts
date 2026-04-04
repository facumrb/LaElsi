import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-search-input',
  imports: [FormsModule, NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapSearch,
    }),
  ],
  templateUrl: './search-input.component.html',
})
export class SearchInputComponent {
  query = model.required<string>();
  placeholder = input<string>('Buscar...');
}
