import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { supabase } from '@services/supabase.client';
import { environment } from 'src/environments/environment';
import { ProfilePageComponent } from './profile-page.component';

// Al entrar al perfil la pantalla pedía los pedidos dos veces: una desde el parámetro de página
// de la URL y otra desde loadFullProfile. Pero ese segundo pedido también es lo que refresca la
// lista después de cancelar un pedido, así que ese refresco tiene que seguir funcionando.
describe('ProfilePageComponent: carga de datos', () => {
  const urlCuenta = `${environment.apiUrl}/clients/account/7`;
  const esPedidos = (req: { url: string }) => req.url.startsWith(`${environment.apiUrl}/orders/client/7`);

  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    // No se le habla al Supabase real
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: { subscription: { unsubscribe: () => undefined } },
    } as never);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(AuthService).currentUser.set({ id: 7, name: 'Ana', lastName: 'Pérez', role: UserRole.Client });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('al entrar pide la cuenta una vez y los pedidos UNA sola vez', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();

    expect(http.match(urlCuenta)).toHaveLength(1);
    expect(http.match(esPedidos)).toHaveLength(1);
    http.verify();
  });

  it('cuando una pantalla hija avisa un cambio (ej: pedido cancelado) vuelve a pedir la cuenta y los pedidos', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    http.match(urlCuenta);
    http.match(esPedidos);

    const profileUpdated = new Subject<void>();
    fixture.componentInstance.onActivate({ profileUpdated });
    profileUpdated.next();

    expect(http.match(urlCuenta)).toHaveLength(1);
    expect(http.match(esPedidos)).toHaveLength(1);
    http.verify();
  });
});
