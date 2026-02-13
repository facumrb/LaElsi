import { Component, signal, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { IApiProduct } from '@models/product.model';
import { ApiProductService } from '@services/api-product.service';
import { environment } from 'src/environments/environment';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch } from '@ng-icons/bootstrap-icons';
import { FormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-search-bar',
  imports: [CurrencyPipe, NgIconComponent, FormsModule, ClickOutsideDirective],
  viewProviders: provideIcons({
    bootstrapSearch,
  }),
  templateUrl: './search-bar.component.html',
})
export class SearchBarComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  ApiProductService = inject(ApiProductService);

  query = signal('');
  results = signal<IApiProduct[]>([]); // Resultados rápidos (limitados a 5 o 6)
  showResults = signal(false);
  isLoading = signal(false);

  // Lógica para evitar peticiones excesivas
  private searchSubject = new Subject<string>();

  constructor() {
    // Escuchamos el Subject y solo buscamos cuando el usuario deja de escribir
    this.searchSubject
      .pipe(
        debounceTime(200),
        distinctUntilChanged(), // Solo busca si el texto cambió
        tap(() => this.isLoading.set(true)),
        switchMap((term) =>
          this.ApiProductService.searchProducts(term).pipe(
            // Aseguramos que si falla o termina, quitamos el loading
            catchError((err) => {
              console.error(err);
              return of([]); // Retorna array vacío si falla
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef), // Limpieza automática
      )
      .subscribe({
        next: (products) => {
          this.results.set(products.slice(0, 6)); // Guardamos solo las 6 mejores coincidencias
          this.showResults.set(products.length > 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private readonly imageBaseUrl = environment.productImagesUrl;

  buildUrl(fileName: string): string {
    return `${this.imageBaseUrl}${fileName}`;
  }

  getProductPrice(product: IApiProduct): number {
    const currentPrice = product.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.amount : 0;
  }

  getProductCurrency(product: IApiProduct): string {
    const currentPrice = product.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.currency : 'ARS';
  }

  // Simulación de búsqueda mientras escribe
  onSearch(term: string) {
    this.query.set(term);
    if (term.length > 2) {
      this.isLoading.set(true);
      this.searchSubject.next(term); // Enviamos al flujo de RxJS
    } else {
      this.showResults.set(false);
      this.results.set([]);
      this.isLoading.set(false);
    }
  }

  // Escenario 1: Click en producto específico
  goToProduct(productId: number) {
    this.showResults.set(false);
    this.query.set('');
    this.router.navigate(['/product', productId]);
  }

  // Escenario 2: Enter o Click en botón Lupa
  handleFullSearch() {
    if (this.query().trim()) {
      this.showResults.set(false);
      this.router.navigate(['/search'], { queryParams: { q: this.query() } });
    }
  }

  clearSearch() {
    this.query.set('');
    this.results.set([]);
    this.showResults.set(false);
  }
}
