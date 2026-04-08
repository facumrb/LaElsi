import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiProductService } from '@services/api-services/api-product.service';
import { ApiCategoryService } from '@services/api-services/api-category.service';
import { AlertService } from '@services/alert.service';
import { ProductsListComponent } from './products-list/products-list.component';
import {
  ProductsToolbarComponent,
  StatusFilter,
  StockFilter,
} from './products-toolbar/products-toolbar.component';
import { Router, ActivatedRoute } from '@angular/router';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BulkPriceModalComponent } from './products-toolbar/components/bulk-price-modal/bulk-price-modal.component';
import { effect } from '@angular/core';

interface SimpleCategory {
  id: number;
  name: string;
}

@Component({
  selector: 'app-products-page',
  imports: [
    ReactiveFormsModule,
    ProductsListComponent,
    ProductsToolbarComponent,
    BulkPriceModalComponent,
    PaginationComponent,
  ],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private apiService = inject(ApiProductService);
  private categoryService = inject(ApiCategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private productsRaw = signal<IApiProduct[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);

  allCategories = signal<SimpleCategory[]>([]);

  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('Todos');
  stockFilter = signal<StockFilter>('Todos');
  categoryFilter = signal<number | 'Todos'>('Todos');

  showBulkModal = signal(false);

  availableCategories = computed<SimpleCategory[]>(() => this.allCategories());

  filtersActive = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'Todos' ||
      this.stockFilter() !== 'Todos' ||
      this.categoryFilter() !== 'Todos'
    );
  });

  productsFiltered = computed(() => {
    // El filtrado grueso ya viene del server
    // Solo aplicamos ordenamiento local de la página si es necesario
    const currentProducts = this.productsRaw();
    const stockType = this.stockFilter();
    
    const sorted = [...currentProducts];

    if (stockType === 'MasProductos') {
      sorted.sort((a, b) => b.stock - a.stock);
    } else if (stockType === 'MenosProductos') {
      sorted.sort((a, b) => a.stock - b.stock);
    }

    return sorted;
  });

  selectedIds = signal<number[]>([]);

  constructor() {
    // Al cambiar cualquier filtro, reseteamos paginación
    effect(() => {
      this.searchQuery();
      this.statusFilter();
      this.stockFilter();
      this.categoryFilter();
      this.onFilterChange();
    });
  }

  handleBulkPriceUpdate() {
    if (this.selectedIds().length === 0) {
      this.alertService.toast('Selecciona al menos un producto', 'warning');
      return;
    }
    this.showBulkModal.set(true);
  }

  handleBulkSuccess() {
    this.showBulkModal.set(false);
    this.loadProducts();
    this.selectedIds.set([]); // Limpiar selección tras éxito
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.currentPage.set(Number(params.get('page')) || 1);
      this.loadProducts();
    });
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe((cats) => {
      // Flatten or map categories for the filter
      const flat: SimpleCategory[] = [];
      const process = (c: any) => {
        flat.push({ id: c.id, name: c.name });
        if (c.children) c.children.forEach(process);
      };
      cats.forEach(process);
      this.allCategories.set(flat.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }

  // Detectar cambios en filtros para volver a página 1
  onFilterChange() {
    if (this.currentPage() !== 1) {
      this.onPageChange(1);
    } else {
      this.loadProducts();
    }
  }

  loadProducts() {
    const filters = {
      query: this.searchQuery(),
      state: this.statusFilter(),
      categoryId: this.categoryFilter() === 'Todos' ? undefined : (this.categoryFilter() as number),
      stockFilter: this.stockFilter()
    };

    this.apiService.getAllProducts(this.currentPage(), 16, filters).subscribe({
      next: (data) => {
        this.productsRaw.set(data.data);
        this.totalPages.set(data.totalPages);
      },
    });
  }

  onPageChange(page: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleNavigateToCreate() {
    this.router.navigate(['/admin/products/create']);
  }

  handleNavigateToEdit(product: IApiProduct) {
    this.router.navigate(['/admin/products/edit', product.id]);
  }

  handleDelete(product: IApiProduct) {
    this.alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this.apiService.deleteProduct(product.id).subscribe({
          next: () => {
            this.alertService.toast('Producto eliminado', 'success');
            this.productsRaw.update((currentProducts) =>
              currentProducts.filter((p) => p.id !== product.id),
            );
          },
        });
      }
    });
  }
}
