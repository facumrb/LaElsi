import { Component, inject, signal, computed } from '@angular/core';
import { IApiCategory, CategoryState } from '@models/category.model';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@services/alert.service';
import { CategoriesListComponent } from './categories-list/categories-list.component';
import {
  CategoriesToolbarComponent,
  StatusFilter,
  StockFilter,
} from './categories-toolbar/categories-toolbar.component';
import { Router } from '@angular/router';
import {
  injectCategoryTreeQuery,
  injectUpdateCategoryMutation,
  injectDeleteCategoryMutation,
} from '@services/queries/category-queries';

@Component({
  selector: 'app-categories-page',
  imports: [
    ReactiveFormsModule,
    CategoriesListComponent,
    CategoriesToolbarComponent,
  ],
  templateUrl: './categories-page.component.html',
})
export class CategoriesPageComponent {
  private alertService = inject(AlertService);
  private router = inject(Router);

  statusFilter = signal<StatusFilter>('Todos');
  stockFilter = signal<StockFilter>('Todos');
  searchQuery = signal('');

  // Tier 2: Query Layer
  categoriesQuery = injectCategoryTreeQuery();
  private updateMutation = injectUpdateCategoryMutation();
  private deleteMutation = injectDeleteCategoryMutation();

  private categoriesRaw = computed(() => this.categoriesQuery.data() ?? []);

  filtersActive = computed(() =>
    this.searchQuery() !== '' ||
    this.statusFilter() !== 'Todos' ||
    this.stockFilter() !== 'Todos'
  );

  categoriesFiltered = computed(() => {
    const currentCategories = this.categoriesRaw();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const stockType = this.stockFilter();

    const getParentId = (c: IApiCategory): number | null =>
      c.parentId ?? c.parent?.id ?? null;

    let filtered = currentCategories.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(query) ||
        (cat.description || '').toLowerCase().includes(query);
      const matchesStatus = status === 'Todos' || cat.state === status;
      const cant = cat.products?.length || 0;
      let matchesStock = true;
      if (stockType === 'ConProductos') matchesStock = cant > 0;
      if (stockType === 'SinProductos') matchesStock = cant === 0;
      return matchesSearch && matchesStatus && matchesStock;
    });

    if (stockType === 'MasProductos') {
      filtered = filtered.sort((a, b) => (b.products?.length || 0) - (a.products?.length || 0));
    } else if (stockType === 'MenosProductos') {
      filtered = filtered.sort((a, b) => (a.products?.length || 0) - (b.products?.length || 0));
    } else {
      if (this.filtersActive()) {
        filtered.sort((a, b) => a.order - b.order);
      } else {
        const buildTree = (list: IApiCategory[], parentId: number | null = null): IApiCategory[] =>
          list
            .filter((c) => getParentId(c) === parentId)
            .sort((a, b) => a.order - b.order)
            .reduce((acc: IApiCategory[], cat) => [...acc, cat, ...buildTree(list, cat.id)], []);
        return buildTree(currentCategories);
      }
    }
    return filtered;
  });

  handleNavigateToCreate() {
    this.router.navigate(['/admin/categories/create']);
  }

  handleNavigateToEdit(category: IApiCategory) {
    this.router.navigate(['/admin/categories/edit', category.id]);
  }

  handleDelete(category: IApiCategory) {
    const cantidadProductos = category.products?.length || 0;
    if (cantidadProductos > 0) {
      this.alertService.error(
        'Acción Bloqueada',
        `No puedes eliminar la categoría "${category.name}" porque tiene productos asociados. Primero debe eliminar o cambiar de categoría esos productos.`
      );
      return;
    }

    this.alertService.confirmEntityDelete(category.name, 'categoría', true).then((choice) => {
      if (choice === 'deactivate') {
        this.updateMutation.mutate(
          { id: category.id, category: { state: CategoryState.Inactivo } },
          { onSuccess: () => this.alertService.toast('Categoría desactivada lógicamente', 'success') }
        );
      } else if (choice === 'delete') {
        this.deleteMutation.mutate(category.id, {
          onSuccess: () => this.alertService.toast('Categoría eliminada físicamente', 'success'),
        });
      }
    });
  }
}
