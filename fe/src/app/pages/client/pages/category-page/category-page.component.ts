import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
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

@Component({
  selector: 'app-category-page',
  imports: [
    ProductCardComponent,
    ProductsFilterComponent,
    BreadcrumbsComponent,
    PaginationComponent,
  ],
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

  // Computed para productos filtrados
  productsFiltered = computed(() => {
    const currentProducts = this.productsRaw();
    const priceOrder = this.priceOrder();
    const brandSelected = this.brandFilter();
    const popularityOrder = this.popularityOrder();

    let filtered = currentProducts.filter((p) => {
      // Filtro de Marca
      const matchesBrand =
        brandSelected === 'Todas' || p.brand === brandSelected;
      return matchesBrand;
    });

    // Ordenamiento por Precio
    if (priceOrder === 'Menor') {
      // Menor a Mayor (más barato primero)
      filtered.sort((a, b) => {
        const priceA = a.prices.find((pr) => pr.isCurrent)?.amount || 0;
        const priceB = b.prices.find((pr) => pr.isCurrent)?.amount || 0;
        return priceA - priceB;
      });
    } else if (priceOrder === 'Mayor') {
      // Mayor a Menor (más caro primero)
      filtered.sort((a, b) => {
        const priceA = a.prices.find((pr) => pr.isCurrent)?.amount || 0;
        const priceB = b.prices.find((pr) => pr.isCurrent)?.amount || 0;
        return priceB - priceA;
      });
    }

    // Ordenamiento por Ventas
    if (popularityOrder === 'MasVentas') {
      // Mayor a Menor (más ventas primero)
      filtered.sort((a, b) => b.totalSold - a.totalSold);
    } else if (popularityOrder === 'MenosVentas') {
      // Menor a Mayor (menos ventas primero)
      filtered.sort((a, b) => a.totalSold - b.totalSold);
    }

    // Si no hay ordenamiento por precio ni por ventas, mantener orden por ID
    if (priceOrder === 'Defecto' && popularityOrder === 'Defecto') {
      filtered.sort((a, b) => a.id - b.id);
    }

    return filtered;
  });

  // Effect para extraer las marcas disponibles de los productos
  private brandExtractor = effect(() => {
    const products = this.productsRaw();
    const brands = [...new Set(products.map((p) => p.brand))].sort();
    this.availableBrands.set(brands);
  });

  ngOnInit(): void {
    // Escuchar tanto params (id) como queryParams (page)
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      
      // Combinar con query parameters actuales
      const pageParam = this.route.snapshot.queryParamMap.get('page');
      this.currentPage.set(Number(pageParam) || 1);
      
      this.cargarDatosDePagina(id);
    });
    
    // Escuchar también cambios solo en queryParams cuando ya estamos en la misma categoría
    this.route.queryParamMap.subscribe((queryParams) => {
      const newPage = Number(queryParams.get('page')) || 1;
      const idStr = this.route.snapshot.paramMap.get('id');
      if (idStr && Number(idStr) > 0 && newPage !== this.currentPage()) {
        this.currentPage.set(newPage);
        this.cargarDatosDePagina(Number(idStr));
      }
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

    // 2. Obtener los productos activos de la categoría con paginación
    this.ApiProductService.getActiveProductsByCategory(id, this.currentPage()).subscribe({
      next: (data) => {
        this.productsRaw.set(data.data);
        this.totalPages.set(data.totalPages);
      },
    });
  }

  onPageChange(page: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Mejor UX
  }

  closeInactiveModal() {
    this.showInactiveCategoryModal.set(false);
    this.router.navigate(['/']);
  }
}
