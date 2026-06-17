import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { IApiProduct, ProductState } from '@models/product.model';
import { IApiCategory } from '@models/category.model';
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

@Component({
  selector: 'app-products-page',
  imports: [
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

  allCategories = signal<IApiCategory[]>([]);

  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('Todos');
  stockFilter = signal<StockFilter>('Todos');
  categoryFilter = signal<number | 'Todos'>('Todos');

  showBulkModal = signal(false);

  availableCategories = computed<IApiCategory[]>(() => this.allCategories());

  filtersActive = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'Todos' ||
      this.stockFilter() !== 'Todos' ||
      this.categoryFilter() !== 'Todos'
    );
  });

  productsFiltered = computed(() => {
    return [...this.productsRaw()];
  });

  selectedIds = signal<number[]>([]);

  constructor() {
    // Al cambiar cualquier filtro, reseteamos a página 1 y recargamos del server.
    effect(() => {
      this.searchQuery();
      this.statusFilter();
      this.stockFilter();
      this.categoryFilter();
      untracked(() => {
        if (this.initialLoadDone) {
          this.currentPage.set(1);
          this.loadProducts();
        }
      });
    });
  }

  private initialLoadDone = false;

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
    const pageParam = this.route.snapshot.queryParamMap.get('page');
    this.currentPage.set(Number(pageParam) || 1);
    this.loadProducts();
    this.initialLoadDone = true;
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe((cats) => {
      this.allCategories.set(cats);
    });
  }

  loadProducts() {
    const filters = {
      query: this.searchQuery(),
      state: this.statusFilter(),
      categoryId:
        this.categoryFilter() === 'Todos'
          ? undefined
          : (this.categoryFilter() as number),
      stockFilter: this.stockFilter(),
    };

    this.apiService.getAllProducts(this.currentPage(), 16, filters).subscribe({
      next: (data) => {
        this.productsRaw.set(data.data);
        this.totalPages.set(data.totalPages);
      },
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
    this.loadProducts();
  }

  handleNavigateToCreate() {
    this.router.navigate(['/admin/products/create']);
  }

  handleNavigateToEdit(product: IApiProduct) {
    this.router.navigate(['/admin/products/edit', product.id]);
  }

  handleDelete(product: IApiProduct) {
    this.alertService.confirmEntityDelete(product.name, 'producto', true).then((choice) => {
      if (choice === 'deactivate') {
        this.apiService.updateProduct(product.id, { state: ProductState.Inactivo }).subscribe({
          next: () => {
            this.alertService.toast('Producto desactivado lógicamente', 'success');
            this.loadProducts();
          },
        });
      } else if (choice === 'delete') {
        this.apiService.deleteProduct(product.id).subscribe({
          next: () => {
            this.alertService.toast('Producto eliminado físicamente', 'success');
            // Recargamos desde el servidor para que la paginación se recalcule
            this.loadProducts();
          },
        });
      }
    });
  }
}
