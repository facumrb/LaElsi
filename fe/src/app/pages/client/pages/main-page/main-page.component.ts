import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiProductService } from '@services/api-services/api-product.service';
import { ApiCategoryService } from '@services/api-services/api-category.service';
import { IApiProduct } from '@models/product.model';
import { IApiCategory } from '@models/category.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { forkJoin, map } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronLeft,
  bootstrapChevronRight,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-main-page',
  imports: [ProductCardComponent, NgIconComponent],
  viewProviders: [
    provideIcons({ bootstrapChevronLeft, bootstrapChevronRight }),
  ],
  templateUrl: './main-page.component.html',
})
export class MainPageComponent implements OnInit {
  private apiProductService = inject(ApiProductService);
  private apiCategoryService = inject(ApiCategoryService);

  globalBestSellers = signal<IApiProduct[]>([]);
  categoriesWithBestSellers = signal<
    { category: IApiCategory; products: IApiProduct[] }[]
  >([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    // 1. Obtener los más vendidos generales
    this.apiProductService.getBestSellers(10).subscribe({
      next: (products) => this.globalBestSellers.set(products),
      error: (err) => console.error('Error fetching global best sellers', err),
    });

    // 2. Obtener categorías activas y sus más vendidos
    this.apiCategoryService.getActiveCategories().subscribe({
      next: (categories) => {
        // Limitamos a algunas categorías para la home
        const topCategories = categories.slice(0, 5);

        const requests = topCategories.map((cat) =>
          this.apiProductService
            .getBestSellersByCategory(cat.id, 10)
            .pipe(map((products) => ({ category: cat, products }))),
        );

        if (requests.length === 0) {
          this.loading.set(false);
          return;
        }

        forkJoin(requests).subscribe({
          next: (results) => {
            // Mostramos solo categorías con productos vendidos
            this.categoriesWithBestSellers.set(
              results.filter((r) => r.products.length > 0),
            );
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error fetching categories best sellers', err);
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Error fetching categories', err);
        this.loading.set(false);
      },
    });
  }

  scrollCarousel(container: HTMLElement, direction: 'left' | 'right') {
    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }
}
