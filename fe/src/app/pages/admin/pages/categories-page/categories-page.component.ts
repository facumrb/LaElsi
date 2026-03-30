import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ApiCategoryService } from '@services/api-services/api-category.service';
import { IApiCategory } from '@models/category.model';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@services/alert.service';
import { CategoriesListComponent } from './categories-list/categories-list.component';
import {
  CategoriesToolbarComponent,
  StatusFilter,
  StockFilter,
} from './categories-toolbar/categories-toolbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories-page',
  imports: [
    ReactiveFormsModule,
    CategoriesListComponent,
    CategoriesToolbarComponent,
  ],
  templateUrl: './categories-page.component.html',
})
export class CategoriesPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private apiService = inject(ApiCategoryService);
  private router = inject(Router);
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

    // Helper para obtener parentId de forma consistente
    const getParentId = (c: IApiCategory): number | null =>
      c.parentId ?? c.parent?.id ?? null;

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
      // ORDENAMIENTO JERÁRQUICO (POR DEFECTO)
      // Si hay filtros activos (búsqueda), no podemos mantener la jerarquía estricta,
      // pero si no hay filtros, ordenamos: Padre -> Hijos (por orden)
      if (this.filtersActive()) {
        filtered.sort((a, b) => a.order - b.order);
      } else {
        const buildTree = (
          list: IApiCategory[],
          parentId: number | null = null,
        ): IApiCategory[] => {
          return list
            .filter((c) => getParentId(c) === parentId)
            .sort((a, b) => a.order - b.order)
            .reduce((acc: IApiCategory[], cat) => {
              return [...acc, cat, ...buildTree(list, cat.id)];
            }, []);
        };
        return buildTree(currentCategories);
      }
    }

    return filtered;
  });

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getAllCategories().subscribe({
      next: (data) => {
        this.categoriesRaw.set(data);
      },
    });
  }

  handleNavigateToCreate() {
    this.router.navigate(['/admin/categories/create']);
  }

  handleNavigateToEdit(category: IApiCategory) {
    this.router.navigate(['/admin/categories/edit', category.id]);
  }

  // --- Lógica para borrar la categoria ---
  handleDelete(category: IApiCategory) {
    const cantidadProductos = category.products?.length || 0;
    if (cantidadProductos > 0) {
      this.alertService.error(
        'Acción Bloqueada',
        `No puedes eliminar la categoría <b>"${category.name}"</b> porque tiene productos asociados.<br><br>💡 Primero elimine o cambie de categoría esos productos.`,
      );
      return;
    }

    this.alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this.apiService.deleteCategory(category.id).subscribe({
          next: () => {
            this.loadCategories(); // Recargar para sincronizar corrimiento de órdenes
            this.alertService.toast('Categoría eliminada', 'success');
          },
        });
      }
    });
  }
}
