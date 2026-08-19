import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCardComponent } from '@client/components/product-card/product-card.component';
import {
  ProductsFilterComponent,
  PriceOrder,
  PopularityOrder,
} from '@client/components/products-filter/products-filter.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BreadcrumbsComponent } from '@client/components/breadcrumbs/breadcrumbs.component';
import { injectActiveProductsQuery } from '@services/queries/product-queries';

@Component({
  selector: 'app-search-result',
  imports: [
    ProductCardComponent,
    ProductsFilterComponent,
    PaginationComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './search-result.component.html',
})
export class SearchResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  searchTerm = signal<string>('');
  currentPage = signal<number>(1);

  // Filtros
  priceOrder = signal<PriceOrder>('Defecto');
  brandFilter = signal<string>('Todas');
  popularityOrder = signal<PopularityOrder>('Defecto');

  // Breadcrumbs dinámicos
  breadcrumbSteps = computed(() => [
    { label: 'Búsqueda' },
    {
      label: this.searchTerm()
        ? `Resultados para "${this.searchTerm()}"`
        : 'Todos los productos',
    },
  ]);

  // Computed filter bundle — TanStack Query reacts automatically to any change
  private activeFilters = computed(() => ({
    query: this.searchTerm(),
    brand: this.brandFilter(),
    priceOrder: this.priceOrder(),
    popularityOrder: this.popularityOrder(),
    page: this.currentPage(),
    limit: 16,
  }));

  // Tier 2: Query Layer
  productsQuery = injectActiveProductsQuery(this.activeFilters);

  productsFiltered = computed(() => this.productsQuery.data()?.data ?? []);
  totalPages = computed(() => this.productsQuery.data()?.totalPages ?? 1);

  availableBrands = computed(() => {
    if (this.brandFilter() !== 'Todas') return [];
    return [...new Set((this.productsQuery.data()?.data ?? []).map((p) => p.brand))].sort();
  });

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const newQ = params['q'] || '';
      const newPage = Number(params['page']) || 1;
      // Signals updated → TanStack Query auto-refetches if key changed
      this.searchTerm.set(newQ);
      this.currentPage.set(newPage);
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
