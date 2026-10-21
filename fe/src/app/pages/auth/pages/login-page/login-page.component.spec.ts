import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginData } from '@models/auth.model';
import { AlertService } from '@services/alert.service';
import { AuthService } from '@services/auth.service';
import { FormUtils } from '@shared/validators/form-utils';
import { LoginPageComponent } from './login-page.component';

// El backend resuelve la cuenta por email O por nombre de usuario (auth/index.ts),
// así que el formulario no puede rechazar ninguno de los dos.
describe('LoginPageComponent: identificador de acceso', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
  });

  // Cada llamada crea un componente nuevo, con su propio formulario
  function crearFormulario() {
    return TestBed.createComponent(LoginPageComponent).componentInstance.formLogin;
  }

  function usuarioValido(valor: string): boolean {
    const form = crearFormulario();
    form.controls.username.setValue(valor);
    return form.controls.username.valid;
  }

  it('acepta un nombre de usuario', () => {
    expect(usuarioValido('admin')).toBe(true);
    expect(usuarioValido('maria_g.01-x')).toBe(true);
  });

  it('acepta un email, también con mayúsculas y más de 30 caracteres', () => {
    expect(usuarioValido('tu.email+tienda@dominio.com')).toBe(true);
    expect(usuarioValido('Admin@Dominio.com.ar')).toBe(true);
    expect(usuarioValido('nombre.muy.largo.de.una.persona@laelsi.com.ar')).toBe(true);
  });

  it('rechaza valores demasiado cortos, con espacios o vacíos', () => {
    expect(usuarioValido('ab')).toBe(false);
    expect(usuarioValido('con espacio@dominio.com')).toBe(false);
    expect(usuarioValido('   ')).toBe(false);
    expect(usuarioValido('')).toBe(false);
  });

  it('rechaza valores de más de 255 caracteres (mismo límite que forgot-password)', () => {
    expect(usuarioValido('a'.repeat(256))).toBe(false);
  });

  // El formulario le pasa al servicio lo que la persona escribió, sea usuario o email
  it.each([
    ['nombre de usuario', 'usuario.demo'],
    ['email', 'persona.demo@example.com'],
  ])('al enviar con %s: llama al login con ese valor y la contraseña', (_tipo, credencial) => {
    const auth = TestBed.inject(AuthService);
    const login = vi.spyOn(auth, 'login').mockReturnValue(of({} as LoginData));
    vi.spyOn(TestBed.inject(AlertService), 'toast').mockResolvedValue(undefined);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const componente = TestBed.createComponent(LoginPageComponent).componentInstance;
    componente.formLogin.setValue({ username: credencial, password: 'una-contraseña-larga-123' });
    componente.onSubmit();

    expect(login).toHaveBeenCalledExactlyOnceWith(credencial, 'una-contraseña-larga-123');
  });

  it('con un email con espacios no llama al login', () => {
    const login = vi.spyOn(TestBed.inject(AuthService), 'login');

    const componente = TestBed.createComponent(LoginPageComponent).componentInstance;
    componente.formLogin.setValue({ username: 'con espacio@gmail.com', password: 'una-contraseña-larga-123' });
    componente.onSubmit();

    expect(login).not.toHaveBeenCalled();
  });

  it('el botón de Google delega en el servicio', () => {
    const google = vi.spyOn(TestBed.inject(AuthService), 'loginWithGoogle').mockReturnValue(of(undefined));

    TestBed.createComponent(LoginPageComponent).componentInstance.loginWithGoogle();

    expect(google).toHaveBeenCalledOnce();
  });

  it('muestra un mensaje que habla de email y usuario, no solo de usuario', () => {
    const form = crearFormulario();
    form.controls.username.setValue('con espacio@dominio.com');
    const mensaje = FormUtils.getTextError(form.controls.username.errors ?? {});
    expect(mensaje).toMatch(/email/i);
  });
});
