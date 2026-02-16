import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiProductService } from '@services/api-product.service';
import { ApiCategoryService } from '@services/api-category.service';
import { ProductCardComponent } from '@cliente/components/product-card/product-card.component';
import {
  ProductsFilterComponent,
  PriceOrder,
  PopularityOrder,
} from '@cliente/components/products-filter/products-filter.component';
import { IApiCategory } from '@models/category.model';
import { IApiProduct } from '@models/product.model';

@Component({
  selector: 'app-category-page',
  imports: [ProductCardComponent, ProductsFilterComponent],
  templateUrl: './category-page.component.html',
})
export class CategoryPageComponent implements OnInit {
  private ApiCategoryService = inject(ApiCategoryService);
  private ApiProductService = inject(ApiProductService);
  private route = inject(ActivatedRoute);

  category = signal<IApiCategory | null>(null);
  private productsRaw = signal<IApiProduct[]>([]);
  availableBrands = signal<string[]>([]);

  // Filtros
  priceOrder = signal<PriceOrder>('Defecto');
  brandFilter = signal<string>('Todas');
  popularityOrder = signal<PopularityOrder>('Defecto');

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
    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      this.cargarDatosDePagina(id);
    });
  }

  cargarDatosDePagina(id: number) {
    // 1. Obtener el nombre de la categoría
    this.ApiCategoryService.getCategoryById(id).subscribe({
      next: (data) => this.category.set(data),
      error: (err) => console.error('Error al obtener categoría', err),
    });

    // 2. Obtener los productos de la categoría
    this.ApiProductService.getProductsByCategory(id).subscribe({
      next: (data) => this.productsRaw.set(data),
      error: (err) => console.error('Error al obtener productos', err),
    });
  }
}
