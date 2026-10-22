import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { beforeEach, describe, expect, it } from 'vitest';
import { MainPageComponent } from './main-page.component';

// Disp. 954/2025, art. 1: el link "Botón de arrepentimiento" tiene que estar a simple vista, en lugar
// destacado y en el primer acceso. No pide un banner ni explicar el plazo: eso se cuenta en
// /arrepentimiento, y a quien ya compró en sus pedidos. En el inicio lo ve cualquier visitante.
describe('MainPageComponent: botón de arrepentimiento', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
      ],
    });
  });

  // Los pedidos de productos nunca se responden: la home queda cargando y el botón tiene que verse igual
  function inicio(): HTMLElement {
    const fixture = TestBed.createComponent(MainPageComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('ofrece el link a /arrepentimiento aunque los productos todavía estén cargando', () => {
    const enlace = inicio().querySelector<HTMLAnchorElement>('a[href="/arrepentimiento"]');

    expect(enlace?.textContent?.trim()).toBe('Botón de arrepentimiento');
  });

  it('no le habla de plazos ni de cuentas a quien solo está mirando la tienda', () => {
    const aviso = inicio().querySelector('section[aria-label="Botón de arrepentimiento"]');

    expect(aviso?.textContent).toContain('Botón de arrepentimiento');
    expect(aviso?.textContent).not.toMatch(/10 d[ií]as|sesi[oó]n|cuenta/i);
  });

  it('aparece antes que el mensaje de bienvenida: en el primer acceso, sin tener que bajar', () => {
    const raiz = inicio();
    const enlace = raiz.querySelector('a[href="/arrepentimiento"]');
    const bienvenida = raiz.querySelector('h1');

    expect(enlace?.compareDocumentPosition(bienvenida as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
