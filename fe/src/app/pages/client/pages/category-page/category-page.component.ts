import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiCategoryService } from '@services/api-services/api-category.service';
import { ProductCardComponent } from '@client/components/product-card/product-card.component';
import {
  ProductsFilterComponent,
  PriceOrder,
  PopularityOrder,
} from '@client/components/products-filter/products-filter.component';
import { IApiCategory, CategoryState } from '@models/category.model';
import {
  BreadcrumbsComponent,
  BreadcrumbStep,
} from '@client/components/breadcrumbs/breadcrumbs.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapExclamationTriangle } from '@ng-icons/bootstrap-icons';
import { A11yModule } from '@angular/cdk/a11y';
import { injectActiveProductsQuery } from '@services/queries/product-queries';
import { firstValueFrom } from 'rxjs';

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
  private apiCategoryService = inject(ApiCategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  category = signal<IApiCategory | null>(null);
  showInactiveCategoryModal = signal<boolean>(false);

  // Paginación
  currentPage = signal<number>(1);

  // Filtros
  priceOrder = signal<PriceOrder>('Defecto');
  brandFilter = signal<string>('Todas');
  popularityOrder = signal<PopularityOrder>('Defecto');
  private categoryId = signal<number>(0);

  // Breadcrumbs
  breadcrumbSteps = computed<BreadcrumbStep[]>(() => {
    const cat = this.category();
    if (!cat) return [];
    const steps: BreadcrumbStep[] = [];
    const buildPath = (current: IApiCategory) => {
      steps.unshift({ label: current.name, url: `/category/${current.id}` });
      if (current.parent) buildPath(current.parent);
    };
    buildPath(cat);
    return steps;
  });

  // Computed filter bundle — TanStack Query reacts automatically to any change
  private activeFilters = computed(() => ({
    categoryId: this.categoryId(),
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

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      const pageParam = this.route.snapshot.queryParamMap.get('page');
      this.currentPage.set(Number(pageParam) || 1);
      this.categoryId.set(id);

      // Load category metadata (not a list, not cached via query layer — single fetch)
      firstValueFrom(this.apiCategoryService.getCategoryById(id))
        .then((data) => {
          this.category.set(data);
          if (data.state !== CategoryState.Activo) {
            this.showInactiveCategoryModal.set(true);
          }
        })
        .catch(() => this.router.navigate(['/']));
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

  closeInactiveModal() {
    this.showInactiveCategoryModal.set(false);
    this.router.navigate(['/']);
  }
}
