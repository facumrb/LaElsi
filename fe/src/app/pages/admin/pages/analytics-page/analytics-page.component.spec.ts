import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IAnalyticsSummary } from '@models/analytics.model';
import { DeliveryMethod, OrderState, PaymentMethod } from '@models/order.model';
import { supabase } from '@services/supabase.client';
import { environment } from 'src/environments/environment';
import { AnalyticsPageComponent } from './analytics-page.component';

// Las cifras las calcula el servidor (GET /analytics/summary). Antes la pantalla pedía tres
// listados de 100 filas y contaba, sumaba y ordenaba en el navegador: con más de 100 registros
// los totales salían mal.
describe('AnalyticsPageComponent: estados de la pantalla', () => {
  const urlResumen = `${environment.apiUrl}/analytics/summary`;

  const resumen: IAnalyticsSummary = {
    totalRevenue: 125000,
    totalOrders: 342,
    totalClients: 187,
    totalProducts: 215,
    recentOrders: [
      {
        id: 99,
        status: OrderState.Paid,
        deliveryMethod: DeliveryMethod.Envio,
        paymentMethod: PaymentMethod.Transferencia,
        totalAmount: 5000,
        dateTime: '2026-10-20T15:00:00Z',
        createdAt: '2026-10-20T15:00:00Z',
        updatedAt: '2026-10-20T15:00:00Z',
        client: { id: 3, name: 'Ana', lastName: 'Pérez', email: 'ana@example.com', phone: null },
        items: [],
      },
    ],
    bestSellingProducts: [
      { id: 7, name: 'Cuaderno rayado', totalSold: 80, category: { id: 1, name: 'Papelería' }, photos: [] },
    ],
  };

  let http: HttpTestingController;
  let fixture: ComponentFixture<AnalyticsPageComponent>;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

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
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AnalyticsPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Verifica que la pantalla no pida nada más que el resumen (ni los viejos listados)
    http.verify();
    vi.restoreAllMocks();
  });

  async function responder(cuerpo: object, opciones?: { status: number; statusText: string }) {
    const peticion = await vi.waitFor(() => http.expectOne(urlResumen));
    peticion.flush(cuerpo, opciones);
  }

  async function esperarPantalla(condicion: () => void) {
    await vi.waitFor(() => {
      fixture.detectChanges();
      condicion();
    });
  }

  it('mientras carga muestra marcadores y no cifras inventadas en cero', async () => {
    expect(texto()).toContain('Cargando órdenes…');
    expect(texto()).toContain('Cargando estadísticas…');
    expect(texto()).not.toContain('Aún no hay órdenes registradas');

    await responder({ data: resumen }); // deja la petición resuelta para el verify
  });

  it('con la respuesta muestra los totales del servidor, tal cual (sin tope de 100)', async () => {
    await responder({ data: resumen });
    await esperarPantalla(() => expect(texto()).toContain('342'));

    expect(texto()).toContain('187');
    expect(texto()).toContain('215');
    expect(texto()).toContain('125,000'); // ingresos, formateados como moneda
    expect(texto()).toContain('#99 - Ana Pérez');
    expect(texto()).toContain('Cuaderno rayado');
    expect(texto()).toContain('Papelería');
  });

  it('sin datos muestra los estados vacíos, no los de carga ni error', async () => {
    await responder({
      data: { ...resumen, totalRevenue: 0, totalOrders: 0, totalClients: 0, totalProducts: 0, recentOrders: [], bestSellingProducts: [] },
    });
    await esperarPantalla(() => expect(texto()).toContain('Aún no hay órdenes registradas'));

    expect(texto()).toContain('Aún no hay estadísticas de ventas');
    expect(texto()).not.toContain('No se pudieron cargar');
  });

  it('si falla muestra el error y "Reintentar" vuelve a pedir el resumen', async () => {
    await responder({ message: 'Algo salió muy mal!' }, { status: 500, statusText: 'Server Error' });
    await esperarPantalla(() => expect(texto()).toContain('No se pudieron cargar las analíticas.'));

    const reintentar = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Reintentar'),
    );
    reintentar?.click();

    await responder({ data: resumen });
    await esperarPantalla(() => expect(texto()).toContain('342'));
    expect(texto()).not.toContain('No se pudieron cargar');
  });
});
