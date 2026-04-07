import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IApiCategory } from '@models/category.model';
import { IApiProduct } from '@models/product.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSearch,
  bootstrapBoxSeam,
  bootstrapPencilSquare,
  bootstrapArrowRightShort,
} from '@ng-icons/bootstrap-icons';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { CloseModalButtonComponent } from '@shared/components/buttons/close-modal-button/close-modal-button.component';
import { SearchInputComponent } from '@admin/components/toolbar-components/search-input/search-input.component';
import { ProductImageComponent } from '@shared/components/product-image/product-image.component';

@Component({
  selector: 'app-category-products-modal',
  imports: [
    FormsModule,
    NgIconComponent,
    ClickOutsideDirective,
    CloseModalButtonComponent,
    SearchInputComponent,
    ProductImageComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapSearch,
      bootstrapBoxSeam,
      bootstrapPencilSquare,
      bootstrapArrowRightShort,
    }),
  ],
  templateUrl: './category-products-modal.component.html',
})
export class CategoryProductsModalComponent {
  category = input.required<IApiCategory>();
  close = output<void>();
  onNavigateToProduct = output<IApiProduct>();

  // Lógica del buscador interno
  searchQuery = signal('');

  // Productos filtrados
  filteredProducts = computed(() => {
    const products = this.category().products || [];
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return products;

    return products.filter((p) => p.name.toLowerCase().includes(query));
  });
}
