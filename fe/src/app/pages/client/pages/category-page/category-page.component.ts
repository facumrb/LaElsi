import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiProductService } from '@services/api-services/api-product.service';
import { ApiCategoryService } from '@services/api-services/api-category.service';
import { ProductCardComponent } from '@client/components/product-card/product-card.component';
import {
  ProductsFilterComponent,
  PriceOrder,
  PopularityOrder,
} from '@client/components/products-filter/products-filter.component';
import { IApiCategory, CategoryState } from '@models/category.model';
import { IApiProduct } from '@models/product.model';
import {
  BreadcrumbsComponent,
  BreadcrumbStep,
} from '@client/components/breadcrumbs/breadcrumbs.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapExclamationTriangle } from '@ng-icons/bootstrap-icons';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-category-page',
  imports: [
    ProductCardComponent,
    ProductsFilterComponent,
    BreadcrumbsComponent,
    PaginationComponent,
    NgIconComponent,
    A11yModule,
  ],
  viewProviders: [provideIcons({ bootstrapExclamationTriangle })],
  templateUrl: './category-page.component.html',
})
export class CategoryPageComponent implements OnInit {
  private ApiCategoryService = inject(ApiCategoryService);
  private ApiProductService = inject(ApiProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  category = signal<IApiCategory | null>(null);
  private productsRaw = signal<IApiProduct[]>([]);
  availableBrands = signal<string[]>([]);

  // Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  // Breadcrumbs
  breadcrumbSteps = computed<BreadcrumbStep[]>(() => {
    const cat = this.category();
    if (!cat) return [];

    const steps: BreadcrumbStep[] = [];

    // Función para construir el path hacia arriba
    const buildPath = (current: IApiCategory) => {
      steps.unshift({
        label: current.name,
        url: `/category/${current.id}`,
      });
      if (current.parent) {
        buildPath(current.parent);
      }
    };

    buildPath(cat);
    return steps;
  });

  // Filtros
  priceOrder = signal<PriceOrder>('Defecto');
  brandFilter = signal<string>('Todas');
  popularityOrder = signal<PopularityOrder>('Defecto');

  // Estado del modal para categoría inactiva
  showInactiveCategoryModal = signal<boolean>(false);

  // Los productos ya vienen filtrados y ordenados del server
  productsFiltered = computed(() => [...this.productsRaw()]);

  // ID de la categoría actual
  private currentCategoryId = signal<number>(0);
  private initialLoadDone = false;

  constructor() {
    // Reacciona a cambios en los filtros y recarga del server
    effect(() => {
      this.priceOrder();
      this.brandFilter();
      this.popularityOrder();
      untracked(() => {
        if (this.initialLoadDone && this.currentCategoryId() > 0) {
          this.currentPage.set(1);
          this.loadProducts(this.currentCategoryId());
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

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      const pageParam = this.route.snapshot.queryParamMap.get('page');
      this.currentPage.set(Number(pageParam) || 1);
      this.currentCategoryId.set(id);
      this.cargarDatosDePagina(id);
      this.initialLoadDone = true;
    });
  }

  cargarDatosDePagina(id: number) {
    // 1. Obtener la categoría y validar que esté activa
    this.ApiCategoryService.getCategoryById(id).subscribe({
      next: (data) => {
        this.category.set(data);
        if (data.state !== CategoryState.Activo) {
          this.showInactiveCategoryModal.set(true);
          return;
        }
      },
      error: () => this.router.navigate(['/']),
    });

    // 2. Obtener los productos activos de la categoría con filtros
    this.loadProducts(id);
  }

  loadProducts(categoryId: number) {
    const filters = {
      brand: this.brandFilter(),
      priceOrder: this.priceOrder(),
      popularityOrder: this.popularityOrder(),
    };
    this.ApiProductService.getActiveProductsByCategory(
      categoryId,
      this.currentPage(),
      16,
      filters,
    ).subscribe({
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
    this.loadProducts(this.currentCategoryId());
  }

  closeInactiveModal() {
    this.showInactiveCategoryModal.set(false);
    this.router.navigate(['/']);
  }
}
