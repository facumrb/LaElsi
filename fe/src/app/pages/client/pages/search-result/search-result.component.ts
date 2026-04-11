import {
  Component,
  inject,
  signal,
  computed,
  effect,
  untracked,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiProductService } from '@services/api-services/api-product.service';
import { ProductCardComponent } from '@client/components/product-card/product-card.component';
import {
  ProductsFilterComponent,
  PriceOrder,
  PopularityOrder,
} from '@client/components/products-filter/products-filter.component';
import { IApiProduct } from '@models/product.model';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BreadcrumbsComponent } from '@client/components/breadcrumbs/breadcrumbs.component';

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
  private productService = inject(ApiProductService);
  private productsRaw = signal<IApiProduct[]>([]);
  availableBrands = signal<string[]>([]);
  searchTerm = signal<string>('');

  // Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  // Filtros
  priceOrder = signal<PriceOrder>('Defecto');
  brandFilter = signal<string>('Todas');
  popularityOrder = signal<PopularityOrder>('Defecto');

  // Los productos ya vienen filtrados y ordenados del server
  productsFiltered = computed(() => [...this.productsRaw()]);

  // Breadcrumbs dinámicos
  breadcrumbSteps = computed(() => [
    { label: 'Búsqueda' },
    {
      label: this.searchTerm()
        ? `Resultados para "${this.searchTerm()}"`
        : 'Todos los productos',
    },
  ]);

  private initialLoadDone = false;

  constructor() {
    // Reacciona a cambios en los filtros y recarga del server
    effect(() => {
      this.priceOrder();
      this.brandFilter();
      this.popularityOrder();
      untracked(() => {
        if (this.initialLoadDone) {
          this.currentPage.set(1);
          this.loadProducts();
        }
      });
    });
  }

  // Effect para extraer las marcas disponibles de los productos.
  private brandExtractor = effect(() => {
    const products = this.productsRaw();
    const currentBrand = this.brandFilter();
    if (currentBrand === 'Todas') {
      const brands = [...new Set(products.map((p) => p.brand))].sort();
      this.availableBrands.set(brands);
    }
  });

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const newQ = params['q'] || '';
      const newPage = Number(params['page']) || 1;

      // Solo recargar si cambió el query de búsqueda o la página
      if (newQ !== this.searchTerm() || newPage !== this.currentPage()) {
        this.searchTerm.set(newQ);
        this.currentPage.set(newPage);
        this.loadProducts();
        this.initialLoadDone = true;
      }
    });
  }

  loadProducts() {
    const filters = {
      brand: this.brandFilter(),
      priceOrder: this.priceOrder(),
      popularityOrder: this.popularityOrder(),
    };
    this.productService
      .searchProducts(this.searchTerm(), this.currentPage(), 16, filters)
      .subscribe((prods) => {
        this.productsRaw.set(prods.data);
        this.totalPages.set(prods.totalPages);
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
}
