import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { IApiProduct, ProductState } from '@models/product.model';
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
import {
  injectAllProductsQuery,
  injectUpdateProductMutation,
  injectDeleteProductMutation,
  injectBulkPriceMutation,
} from '@services/queries/product-queries';
import { injectActiveCategoriesQuery } from '@services/queries/category-queries';

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
export class ProductsPageComponent {
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentPage = signal(1);
  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('Todos');
  stockFilter = signal<StockFilter>('Todos');
  categoryFilter = signal<number | 'Todos'>('Todos');
  showBulkModal = signal(false);
  selectedIds = signal<number[]>([]);

  // Computed filter bundle consumed by TanStack Query
  private activeFilters = computed(() => ({
    query: this.searchQuery(),
    state: this.statusFilter(),
    categoryId: this.categoryFilter() === 'Todos' ? undefined : (this.categoryFilter() as number),
    stockFilter: this.stockFilter(),
    page: this.currentPage(),
    limit: 16,
  }));

  // Tier 2: Query Layer
  productsQuery = injectAllProductsQuery(this.activeFilters);
  categoriesQuery = injectActiveCategoriesQuery();
  private updateMutation = injectUpdateProductMutation();
  private deleteMutation = injectDeleteProductMutation();
  private bulkMutation = injectBulkPriceMutation();

  // Derived signals from query results
  productsFiltered = computed(() => this.productsQuery.data()?.data ?? []);
  totalPages = computed(() => this.productsQuery.data()?.totalPages ?? 1);
  availableCategories = computed(() => this.categoriesQuery.data() ?? []);

  filtersActive = computed(() =>
    this.searchQuery() !== '' ||
    this.statusFilter() !== 'Todos' ||
    this.stockFilter() !== 'Todos' ||
    this.categoryFilter() !== 'Todos'
  );

  constructor() {
    // Sync page from URL on init
    const pageParam = this.route.snapshot.queryParamMap.get('page');
    this.currentPage.set(Number(pageParam) || 1);
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
    this.selectedIds.set([]);
    // Cache is automatically invalidated by injectBulkPriceMutation onSuccess
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
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
        this.updateMutation.mutate(
          { id: product.id, product: { state: ProductState.Inactivo } },
          {
            onSuccess: () => this.alertService.toast('Producto desactivado lógicamente', 'success'),
          }
        );
      } else if (choice === 'delete') {
        this.deleteMutation.mutate(product.id, {
          onSuccess: () => this.alertService.toast('Producto eliminado físicamente', 'success'),
        });
      }
    });
  }
}
