import { EntityStateBadgeComponent } from '@admin/components/table-components/entity-state-badge/entity-state-badge.component';
import { TableActionsComponent } from '@admin/components/table-components/table-actions/table-actions.component';
import { Component, inject, input, output, signal } from '@angular/core';
import { IApiCategory } from '@models/category.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapBoxSeam } from '@ng-icons/bootstrap-icons';
import { CategoryProductsModalComponent } from './category-products-modal/category-products-modal.component';
import { Router } from '@angular/router';
import { IApiProduct } from '@models/product.model';
import { TableEmptyStateComponent } from '@admin/components/table-components/table-empty-state/table-empty-state.component';

@Component({
  selector: 'app-categories-list',
  imports: [
    TableActionsComponent,
    NgIconComponent,
    CategoryProductsModalComponent,
    TableEmptyStateComponent,
    EntityStateBadgeComponent,
  ],
  viewProviders: provideIcons({
    bootstrapBoxSeam,
  }),
  templateUrl: './categories-list.component.html',
})
export class CategoriesListComponent {
  private router = inject(Router);
  categories = input.required<IApiCategory[]>();
  onEdit = output<IApiCategory>();
  onDelete = output<IApiCategory>();
  isFilterActive = input<boolean>(false);

  // Estado para el modal
  selectedCategory = signal<IApiCategory | null>(null);

  // Método para abrir el modal
  openProductsModal(category: IApiCategory) {
    this.selectedCategory.set(category);
  }

  // Método para cerrar el modal
  closeProductsModal() {
    this.selectedCategory.set(null);
  }

  // Método para navegar a la edición del producto
  navigateToProductEdit(product: IApiProduct) {
    this.closeProductsModal();
    this.router.navigate(['/admin/products/edit', product.id]);
  }
}
