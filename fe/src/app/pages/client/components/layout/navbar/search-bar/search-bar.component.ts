import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { IApiProduct } from '@models/product.model';
import { ApiProductService } from '@services/api-product.service';
import { environment } from 'src/environments/environment';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch } from '@ng-icons/bootstrap-icons';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-search-bar',
  imports: [
    CurrencyPipe,
    UpperCasePipe,
    NgIconComponent,
    FormsModule,
    ClickOutsideDirective,
  ],
  viewProviders: provideIcons({
    bootstrapSearch,
  }),
  templateUrl: './search-bar.component.html',
})
export class SearchBarComponent {
  private router = inject(Router);

  ApiProductService = inject(ApiProductService);
  query = signal('');
  results = signal<IApiProduct[]>([]); // Resultados rápidos (limitados a 5 o 6)
  showResults = signal(false);

  // Lógica para evitar peticiones excesivas (Debounce)
  private searchSubject = new Subject<string>();

  constructor() {
    // Escuchamos el Subject y solo buscamos cuando el usuario deja de escribir
    this.searchSubject
      .pipe(
        debounceTime(300), // Espera 300ms
        distinctUntilChanged(), // Solo busca si el texto cambió
        switchMap((term) => this.ApiProductService.searchProducts(term)), // Llama al servicio
        takeUntilDestroyed(), // Limpieza automática en Angular 21
      )
      .subscribe((products) => {
        this.results.set(products.slice(0, 6)); // Guardamos solo las 6 mejores coincidencias
        this.showResults.set(products.length > 0);
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
      this.searchSubject.next(term); // Enviamos al flujo de RxJS
    } else {
      this.showResults.set(false);
      this.results.set([]);
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
}
