import { Component, inject, signal, computed } from '@angular/core';
import { ApiCategoryService } from '@services/api-category.service';
import { IApiCategory } from '@models/category.model';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { CategoriesModalComponent } from './categories-modal/categories-modal.component';
import { CategoriesListComponent } from './categories-list/categories-list.component';
import { CategoriesToolbarComponent } from './categories-toolbar/categories-toolbar.component';
import { StockFilter } from './categories-toolbar/categories-toolbar.component';

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
export class CategoriesPageComponent {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiCategoryService);
  private categoriesRaw = signal<IApiCategory[]>([]);

  statusFilter = signal<'Todos' | 'Activo' | 'Inactivo'>('Todos');
  stockFilter = signal<StockFilter>('Todos');
  searchQuery = signal('');

  categories = computed(() => {
    const raw = this.categoriesRaw();
    const state = this.statusFilter();
    const inv = this.stockFilter();

    const query = this.searchQuery().toLowerCase().trim();

    let filtered = raw.filter((cat) => {
      // Filtro de Estado
      const cumpleEstado = state === 'Todos' || cat.state === state;

      // Filtro de Inventario
      const cant = cat.products?.length || 0;
      let cumpleInv = true;
      if (inv === 'ConProductos') cumpleInv = cant > 0;
      if (inv === 'SinProductos') cumpleInv = cant === 0;

      // Filtro de Búsqueda
      const cumpleBusqueda =
        cat.name.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query));

      return cumpleEstado && cumpleInv && cumpleBusqueda;
    });
    if (inv === 'MasProductos') {
      // Ordenar de Mayor a Menor (Descendente)
      filtered = filtered.sort(
        (a, b) => (b.products?.length || 0) - (a.products?.length || 0),
      );
    } else if (inv === 'MenosProductos') {
      // Ordenar de Menor a Mayor (Ascendente)
      filtered = filtered.sort(
        (a, b) => (a.products?.length || 0) - (b.products?.length || 0),
      );
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
    const request$ = esEdicion
      ? this._apiService.updateCategory(currentCat.name, {
          ...currentCat,
          ...formData,
        })
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
  delete(category: IApiCategory) {
    const cantidadProductos = category.products?.length || 0;
    if (cantidadProductos > 0) {
      this._alertService.error(
        'Acción Bloqueada',
        `No puedes eliminar la categoría <b>"${category.name}"</b> porque tiene <b>${cantidadProductos}</b> productos asociados.<br><br>💡 Primero elimina o mueve esos productos.`,
      );
      return;
    }

    this._alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this._apiService.deleteCategory(category.name).subscribe({
          next: () => {
            this.categoriesRaw.update((cats) =>
              cats.filter((c) => c.name !== category.name),
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
