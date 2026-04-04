import { Component, model } from '@angular/core';
import { SearchInputComponent } from '@admin/components/inputs/search-input/search-input.component';

@Component({
  selector: 'app-categories-search-bar',
  imports: [SearchInputComponent],
  templateUrl: './categories-search-bar.component.html',
})
export class CategoriesSearchBarComponent {
  searchQuery = model.required<string>();
}
