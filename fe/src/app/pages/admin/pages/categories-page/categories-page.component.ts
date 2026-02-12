import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ApiCategoryService } from '@services/api-category.service';
import { IApiCategory } from '@models/category.model';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { CategoriesModalComponent } from './categories-modal/categories-modal.component';
import { CategoriesListComponent } from './categories-list/categories-list.component';
import {
  CategoriesToolbarComponent,
  StatusFilter,
  StockFilter,
} from './categories-toolbar/categories-toolbar.component';

@Component({
  selector: 'app-categories-page',
  imports: [
    ReactiveFormsModule,
    CategoriesModalComponent,
    CategoriesListComponent,
    CategoriesToolbarComponent,
  ],
  templateUrl: './categories-page.component.html',
})
export class CategoriesPageComponent implements OnInit {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiCategoryService);
  private categoriesRaw = signal<IApiCategory[]>([]);

  statusFilter = signal<StatusFilter>('Todos');
  stockFilter = signal<StockFilter>('Todos');
  searchQuery = signal('');

  filtersActive = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'Todos' ||
      this.stockFilter() !== 'Todos'
    );
  });

  categoriesFiltered = computed(() => {
    // Obtenemos los valores actuales de los signals
    const currentCategories = this.categoriesRaw();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const stockType = this.stockFilter();

    // Aplicamos filtros (Search, Status, Stock)
    let filtered = currentCategories.filter((cat) => {
      // Filtro de Búsqueda
      const matchesSearch =
        cat.name.toLowerCase().includes(query) ||
        (cat.description || '').toLowerCase().includes(query);

      // Filtro de Estado
      const matchesStatus = status === 'Todos' || cat.state === status;

      // Filtro de Cantidad de Productos asociados
      const cant = cat.products?.length || 0;
      let matchesStock = true;
      if (stockType === 'ConProductos') matchesStock = cant > 0;
      if (stockType === 'SinProductos') matchesStock = cant === 0;

      return matchesSearch && matchesStatus && matchesStock;
    });

    // Ordenamiento
    if (stockType === 'MasProductos') {
      // Ordenar de Mayor a Menor
      filtered = filtered.sort(
        (a, b) => (b.products?.length || 0) - (a.products?.length || 0),
      );
    } else if (stockType === 'MenosProductos') {
      // Ordenar de Menor a Mayor
      filtered = filtered.sort(
        (a, b) => (a.products?.length || 0) - (b.products?.length || 0),
      );
    } else {
      filtered.sort((a, b) => a.id - b.id);
    }

    return filtered;
  });

  // Estado del modal
  isModalOpen = signal(false);
  selectedCategory = signal<IApiCategory | null>(null);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this._apiService.getAllCategories().subscribe((data) => {
      this.categoriesRaw.set(data);
    });
  }

  // --- Lógica del Modal ---
  openAddModal() {
    this.selectedCategory.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(category: IApiCategory) {
    this.selectedCategory.set(category);
    this.isModalOpen.set(true);
  }

  modalSubmit(formData: any) {
    const currentCat = this.selectedCategory();
    const esEdicion = !!currentCat;

    // Al editar, pasamos currentCat.id para la URL (ID viejo)
    // y formData DIRECTO como body (datos nuevos).

    const request$ = esEdicion
      ? this._apiService.updateCategory(currentCat.id, formData)
      : this._apiService.addCategory(formData);

    request$.subscribe({
      next: () => {
        this.loadCategories();
        this.isModalOpen.set(false);
        this._alertService.toast(
          `Categoría ${esEdicion ? 'editada' : 'creada'} con éxito`,
          'success',
        );
      },
      error: (err) => {
        this._errorService.handle(
          err,
          esEdicion ? 'editar la categoría' : 'crear la categoría',
        );
      },
    });
  }

  // --- Lógica para borrar la categoria ---
  handleDelete(category: IApiCategory) {
    const cantidadProductos = category.products?.length || 0;
    if (cantidadProductos > 0) {
      this._alertService.error(
        'Acción Bloqueada',
        `No puedes eliminar la categoría <b>"${category.name}"</b> porque tiene productos asociados.<br><br>💡 Primero elimine o cambie de categoría esos productos.`,
      );
      return;
    }

    this._alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this._apiService.deleteCategory(category.id).subscribe({
          next: () => {
            this.categoriesRaw.update((cats) =>
              cats.filter((c) => c.id !== category.id),
            );
            this._alertService.toast('Categoría eliminada', 'success');
          },
          error: (err) => {
            this._errorService.handle(err, 'eliminar la categoría');
          },
        });
      }
    });
  }
}
