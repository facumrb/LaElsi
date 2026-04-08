import { Component, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiProductService } from '@services/api-services/api-product.service';
import { ProductCardComponent } from '@client/components/product-card/product-card.component';
import {
  ProductsFilterComponent,
  PriceOrder,
  PopularityOrder,
} from '@client/components/products-filter/products-filter.component';
import { IApiProduct } from '@models/product.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-search-result',
  imports: [ProductCardComponent, ProductsFilterComponent, PaginationComponent],
  templateUrl: './search-result.component.html',
})
export class SearchResultComponent {
  private route = inject(ActivatedRoute);
  private productService = inject(ApiProductService);
  private productsRaw = signal<IApiProduct[]>([]);
  availableBrands = signal<string[]>([]);
  searchTerm = signal<string>('');
  
  // Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  private readonly router = inject(Router);

  constructor() {
    // Sincronizar el query param 'q' y 'page' de la URL con nuestra Signal
    this.route.queryParams.subscribe((params) => {
      this.searchTerm.set(params['q'] || '');
      this.currentPage.set(Number(params['page']) || 1);
      this.loadProducts();
    });
  }

  loadProducts() {
    this.productService.searchProducts(this.searchTerm(), this.currentPage()).subscribe((prods) => {
      this.productsRaw.set(prods.data);
      this.totalPages.set(prods.totalPages);
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

  // Filtros
  public priceOrder = signal<PriceOrder>('Defecto');
  public brandFilter = signal<string>('Todas');
  public popularityOrder = signal<PopularityOrder>('Defecto');

  // Computed para productos filtrados
  public productsFiltered = computed(() => {
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
}
