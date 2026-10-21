import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@services/supabase.client';
import { environment } from 'src/environments/environment';
import { SearchResultComponent } from './search-result.component';

// Los resultados de la búsqueda están paginados: la lista de marcas tiene que salir de TODOS los
// resultados (la informa el servidor), no de los productos de la página que se está mostrando.
describe('SearchResultComponent: filtro de marcas', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    // No se le habla al Supabase real
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: { subscription: { unsubscribe: () => undefined } },
    } as never);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: ActivatedRoute, useValue: { queryParams: of({ q: 'cuaderno' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ofrece todas las marcas que informa el servidor', async () => {
    const fixture = TestBed.createComponent(SearchResultComponent);
    fixture.detectChanges();

    const busqueda = await vi.waitFor(() => http.expectOne((req) => req.url === `${environment.apiUrl}/products/search`));
    expect(busqueda.request.params.get('query')).toBe('cuaderno');
    busqueda.flush({ data: { data: [], total: 0, page: 1, limit: 16, totalPages: 1, brands: ['Bic', 'Faber'] } });

    await vi.waitFor(() => expect(fixture.componentInstance.availableBrands()).toEqual(['Bic', 'Faber']));
  });

  it('si la respuesta no trae marcas (ej: sin resultados) la lista queda vacía', async () => {
    const fixture = TestBed.createComponent(SearchResultComponent);
    fixture.detectChanges();

    const busqueda = await vi.waitFor(() => http.expectOne((req) => req.url === `${environment.apiUrl}/products/search`));
    busqueda.flush({ data: { data: [], total: 0, page: 1, limit: 16, totalPages: 1 } });

    await vi.waitFor(() => expect(fixture.componentInstance.totalPages()).toBe(1));
    expect(fixture.componentInstance.availableBrands()).toEqual([]);
  });
});
