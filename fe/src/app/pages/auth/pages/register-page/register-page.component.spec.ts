import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertService } from '@services/alert.service';
import { AuthService } from '@services/auth.service';
import { LEGAL_INFO } from '@client/pages/footer-pages/legal-info';
import { RegisterPageComponent } from './register-page.component';

// El registro exige tildar "Leí y acepto los Términos y Condiciones y la Política de Privacidad".
// El servidor vuelve a exigirlo y guarda cuándo se aceptó y qué versión de los textos se mostró.
describe('RegisterPageComponent: aceptación de los Términos', () => {
  const datos = {
    username: 'maria.g',
    email: 'maria@example.com',
    password: 'clave-segura-123',
    confirmPassword: 'clave-segura-123',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
  });

  function crear() {
    const componente = TestBed.createComponent(RegisterPageComponent).componentInstance;
    // Estas pruebas no son sobre la unicidad: se evita consultarle al servidor si el usuario o el email existen
    componente.formRegister.controls.username.clearAsyncValidators();
    componente.formRegister.controls.email.clearAsyncValidators();
    // El token lo emite el widget real de Turnstile: acá se da por verificado
    componente.turnstileToken.set('token-de-prueba');
    return componente;
  }

  it('sin tildar la casilla el formulario no es válido', () => {
    const componente = crear();
    componente.formRegister.setValue({ ...datos, acceptTerms: false });

    expect(componente.formRegister.controls.acceptTerms.valid).toBe(false);
    expect(componente.formRegister.valid).toBe(false);
  });

  it('con la casilla tildada el formulario es válido', () => {
    const componente = crear();
    componente.formRegister.setValue({ ...datos, acceptTerms: true });

    expect(componente.formRegister.valid).toBe(true);
  });

  it('sin tildar la casilla no llama al registro', () => {
    const registrar = vi.spyOn(TestBed.inject(AuthService), 'register');
    const componente = crear();

    componente.formRegister.setValue({ ...datos, acceptTerms: false });
    componente.onSubmit();

    expect(registrar).not.toHaveBeenCalled();
  });

  it('al enviar manda la aceptación y la versión de los textos, sin la confirmación de contraseña', () => {
    const registrar = vi.spyOn(TestBed.inject(AuthService), 'register').mockReturnValue(of({ id: 1 }));
    vi.spyOn(TestBed.inject(AlertService), 'toast').mockResolvedValue(undefined);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const componente = crear();

    componente.formRegister.setValue({ ...datos, acceptTerms: true });
    componente.onSubmit();

    expect(registrar).toHaveBeenCalledExactlyOnceWith(
      {
        username: 'maria.g',
        email: 'maria@example.com',
        password: 'clave-segura-123',
        acceptTerms: true,
        termsVersion: LEGAL_INFO.version,
      },
      'token-de-prueba',
    );
  });

  // El registro público no tenía ninguna protección anti-bots: ahora lleva Turnstile
  it('si la verificación anti-bots no terminó, avisa y no llama al registro', () => {
    const registrar = vi.spyOn(TestBed.inject(AuthService), 'register');
    const aviso = vi
      .spyOn(TestBed.inject(AlertService), 'modal')
      .mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false });
    const componente = crear();

    componente.turnstileToken.set(null);
    componente.formRegister.setValue({ ...datos, acceptTerms: true });
    componente.onSubmit();

    expect(aviso).toHaveBeenCalledOnce();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('si el registro falla, no navega y el formulario queda para reintentar', () => {
    vi.spyOn(TestBed.inject(AuthService), 'register').mockReturnValue(throwError(() => ({ error: { message: 'Ya existe' } })));
    const toast = vi.spyOn(TestBed.inject(AlertService), 'toast').mockResolvedValue(undefined);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const componente = crear();

    componente.formRegister.setValue({ ...datos, acceptTerms: true });
    componente.onSubmit();

    expect(toast).toHaveBeenCalledWith('Ya existe', 'error');
    expect(navegar).not.toHaveBeenCalled();
    expect(componente.loading()).toBe(false);
  });
});
