import { Component, inject, signal, computed, effect } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { IApiCategory } from '@models/category.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { ScrollTrackerDirective } from '@shared/directives/scroll-tracker.directive';
import { CarouselNavComponent } from '@client/components/carousel-nav/carousel-nav.component';
import {
  injectBestSellersQuery,
  injectBestSellersByCategoryQuery,
} from '@services/queries/product-queries';
import { injectActiveCategoriesQuery } from '@services/queries/category-queries';

@Component({
  selector: 'app-main-page',
  imports: [
    ProductCardComponent,
    LogoComponent,
    ScrollTrackerDirective,
    CarouselNavComponent,
  ],
  templateUrl: './main-page.component.html',
})
export class MainPageComponent {
  // Tier 2: Query Layer — all data fetching delegated to TanStack Query
  bestSellersQuery = injectBestSellersQuery(10);
  categoriesQuery = injectActiveCategoriesQuery();

  globalBestSellers = computed(() => this.bestSellersQuery.data() ?? []);

  // Top 5 active categories
  topCategories = computed<IApiCategory[]>(() =>
    (this.categoriesQuery.data() ?? []).slice(0, 5)
  );

  // One signal per category slot (supports up to 5)
  private categoryId0 = signal(0);
  private categoryId1 = signal(0);
  private categoryId2 = signal(0);
  private categoryId3 = signal(0);
  private categoryId4 = signal(0);

  // Best sellers per category — each independently cached by TanStack Query
  bestSellers0 = injectBestSellersByCategoryQuery(this.categoryId0, 10);
  bestSellers1 = injectBestSellersByCategoryQuery(this.categoryId1, 10);
  bestSellers2 = injectBestSellersByCategoryQuery(this.categoryId2, 10);
  bestSellers3 = injectBestSellersByCategoryQuery(this.categoryId3, 10);
  bestSellers4 = injectBestSellersByCategoryQuery(this.categoryId4, 10);

  constructor() {
    // When categories load, update the individual category ID signals
    effect(() => {
      const cats = this.topCategories();
      this.categoryId0.set(cats[0]?.id ?? 0);
      this.categoryId1.set(cats[1]?.id ?? 0);
      this.categoryId2.set(cats[2]?.id ?? 0);
      this.categoryId3.set(cats[3]?.id ?? 0);
      this.categoryId4.set(cats[4]?.id ?? 0);
    });
  }

  // Derived: categories with their best seller products (replaces forkJoin pattern)
  categoriesWithBestSellers = computed<{ category: IApiCategory; products: IApiProduct[] }[]>(() => {
    const cats = this.topCategories();
    const queries = [
      this.bestSellers0,
      this.bestSellers1,
      this.bestSellers2,
      this.bestSellers3,
      this.bestSellers4,
    ];
    return cats
      .map((cat, i) => ({ category: cat, products: queries[i]?.data() ?? [] }))
      .filter((r) => r.products.length > 0);
  });

  // True only while initial data is still being fetched
  loading = computed(() =>
    this.bestSellersQuery.isPending() || this.categoriesQuery.isPending()
  );

  scrollCarousel(
    container: HTMLElement,
    direction: 'left' | 'right',
    tracker: any
  ) {
    const width = container.clientWidth;
    const targetLeft = container.scrollLeft + (direction === 'left' ? -width : width);
    const atStart = targetLeft <= 5;
    const atEnd = targetLeft + width >= container.scrollWidth - 5;
    if (atStart || atEnd) tracker.forceState(atStart, atEnd);
    container.scrollTo({ left: targetLeft });
  }
}
