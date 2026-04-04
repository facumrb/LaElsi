import { Component, model } from '@angular/core';
import { SearchInputComponent } from '@admin/components/inputs/search-input/search-input.component';

@Component({
  selector: 'app-products-search-bar',
  imports: [SearchInputComponent],
  templateUrl: './products-search-bar.component.html'
})
export class ProductsSearchBarComponent {
  searchQuery = model.required<string>();
}
