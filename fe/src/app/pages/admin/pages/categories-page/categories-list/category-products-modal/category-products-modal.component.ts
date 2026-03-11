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
import { environment } from 'src/environments/environment';
import { CloseModalButtonComponent } from '@shared/components/buttons/close-modal-button/close-modal-button.component';
import { SearchInputComponent } from '@shared/components/inputs/search-input/search-input.component';

@Component({
  selector: 'app-category-products-modal',
  imports: [
    FormsModule,
    NgIconComponent,
    ClickOutsideDirective,
    CloseModalButtonComponent,
    SearchInputComponent,
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

  // --- Lógica de Imágenes ---
  private readonly imageBaseUrl = environment.productImagesUrl;

  private getImageUrl(fileName: string | undefined): string {
    return `${this.imageBaseUrl}${fileName}`;
  }

  getProductMainImage(product: IApiProduct): string {
    if (product.photos && product.photos.length > 0) {
      return this.getImageUrl(product.photos[0].fileName);
    }
    return 'assets/Webp/no-image.webp';
  }
}
