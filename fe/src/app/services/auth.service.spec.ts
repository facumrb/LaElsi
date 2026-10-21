import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from 'src/environments/environment';
import { UserRole } from '@models/user.model';
import { AuthService } from './auth.service';
import { supabase } from './supabase.client';

// Acceso por contraseña (usuario o email) y por Google. El backend resuelve la cuenta
// por email O por nombre de usuario: el servicio envía lo que la persona escribió
// tal cual, y el formulario es el que decide qué valores deja pasar.
describe('AuthService: inicio de sesión', () => {
  const urlLogin = `${environment.apiUrl}/auth/login`;
  const password = 'una-contraseña-larga-123';

  const respuestaAdmin = {
    status: 'success',
    message: 'Login exitoso',
    data: {
      token: 'access-token-de-prueba',
      refreshToken: 'refresh-token-de-prueba',
      user: { id: 2, username: 'usuario.demo', role: UserRole.Admin },
    },
  };

  let servicio: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);

    // No se le habla al Supabase real: solo se comprueba qué sesión se le entrega
    vi.spyOn(supabase.auth, 'setSession').mockResolvedValue({ data: { session: null, user: null }, error: null } as never);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it.each([
    ['nombre de usuario', 'usuario.demo'],
    ['email', 'persona.demo@example.com'],
  ])('con %s y contraseña: lo envía al login y deja la sesión de administrador', async (_tipo, credencial) => {
    const resultado = new Promise((resolve, reject) =>
      servicio.login(credencial, password).subscribe({ next: resolve, error: reject }),
    );

    const peticion = http.expectOne(urlLogin);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ username: credencial, password });
    peticion.flush(respuestaAdmin);
    await resultado;

    expect(servicio.isLoggedIn()).toBe(true);
    expect(servicio.isAdmin()).toBe(true);
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'access-token-de-prueba',
      refresh_token: 'refresh-token-de-prueba',
    });
  });

  it('con credenciales inválidas (401): propaga el error y no deja ninguna sesión', async () => {
    const resultado = new Promise((_resolve, reject) =>
      servicio.login('usuario.demo', 'incorrecta').subscribe({ error: reject }),
    );

    http.expectOne(urlLogin).flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    await expect(resultado).rejects.toMatchObject({ status: 401 });
    expect(servicio.isLoggedIn()).toBe(false);
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
  });

  it('con Google: inicia el flujo OAuth con el proveedor google y vuelve a la tienda', async () => {
    const oauth = vi
      .spyOn(supabase.auth, 'signInWithOAuth')
      .mockResolvedValue({ data: { provider: 'google', url: 'https://accounts.google.com/' }, error: null } as never);

    await new Promise<void>((resolve, reject) => servicio.loginWithGoogle().subscribe({ next: () => resolve(), error: reject }));

    expect(oauth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  });

  it('con Google: si Supabase devuelve un error, lo propaga para que la pantalla lo muestre', async () => {
    vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({
      data: { provider: 'google', url: null },
      error: new Error('proveedor deshabilitado'),
    } as never);

    const resultado = new Promise((_resolve, reject) => servicio.loginWithGoogle().subscribe({ error: reject }));

    await expect(resultado).rejects.toThrow('proveedor deshabilitado');
  });
});
