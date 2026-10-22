import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSession } from '@models/auth.model';
import { UserRole } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { LEGAL_INFO } from '../../pages/footer-pages/legal-info';
import { TermsGateComponent } from './terms-gate.component';

// Quien entra con Google no tilda ninguna casilla al registrarse: la aceptación se le pide acá.
describe('TermsGateComponent: aceptación de los Términos', () => {
  const cliente: UserSession = { id: 2, name: 'Ana', lastName: 'Pérez', role: UserRole.Client, termsAccepted: false };

  // AuthService de mentira: solo lo que usa el diálogo
  const usuario = signal<UserSession | null>(cliente);
  const acceptTerms = vi.fn();
  const logout = vi.fn();

  beforeEach(() => {
    usuario.set(cliente);
    acceptTerms.mockReset().mockReturnValue(of(void 0));
    logout.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { currentUser: usuario, acceptTerms, logout } }],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(TermsGateComponent);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      raiz,
      dialogo: () => raiz.querySelector('[role="dialog"]'),
      casilla: () => raiz.querySelector<HTMLInputElement>('input[type="checkbox"]'),
      botones: () => Array.from(raiz.querySelectorAll('button')),
    };
  }

  describe('a quién se le muestra', () => {
    it('a un cliente que todavía no aceptó (cuenta de Google o anterior a la casilla)', () => {
      expect(crear().dialogo()).not.toBeNull();
    });

    it.each([
      ['un cliente que ya aceptó', { ...cliente, termsAccepted: true }],
      ['un administrador, aunque no figure aceptación', { ...cliente, role: UserRole.Admin, termsAccepted: false }],
      ['una sesión vieja que todavía se está completando desde el servidor', { ...cliente, termsAccepted: undefined }],
    ])('NO se le muestra a %s', (_quien, sesion) => {
      usuario.set(sesion);
      expect(crear().dialogo()).toBeNull();
    });

    it('NO se le muestra a quien no inició sesión', () => {
      usuario.set(null);
      expect(crear().dialogo()).toBeNull();
    });

    it('es un diálogo modal accesible, con enlaces a los dos textos que se abren en otra pestaña', () => {
      const { dialogo } = crear();

      expect(dialogo()?.getAttribute('aria-modal')).toBe('true');
      const enlaces = Array.from(dialogo()!.querySelectorAll('a'));
      expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['/terminos', '/privacidad']);
      expect(enlaces.every((a) => a.getAttribute('target') === '_blank')).toBe(true);
    });
  });

  describe('al aceptar', () => {
    it('el botón "Aceptar y continuar" está deshabilitado hasta tildar la casilla', () => {
      const { fixture, casilla, botones } = crear();
      const aceptar = () => botones().find((b) => /Aceptar y continuar/.test(b.textContent ?? ''))!;

      expect(aceptar().disabled).toBe(true);

      casilla()!.click();
      fixture.detectChanges();
      expect(aceptar().disabled).toBe(false);

      casilla()!.click();
      fixture.detectChanges();
      expect(aceptar().disabled).toBe(true);
    });

    it('con la casilla tildada registra la aceptación de la versión vigente de los textos', () => {
      const { fixture, casilla, botones } = crear();

      casilla()!.click();
      fixture.detectChanges();
      botones().find((b) => /Aceptar y continuar/.test(b.textContent ?? ''))!.click();

      expect(acceptTerms).toHaveBeenCalledExactlyOnceWith(LEGAL_INFO.version);
    });

    it('sin tildar la casilla no registra nada, aunque se fuerce la llamada', () => {
      const { fixture } = crear();

      fixture.componentInstance.accept();

      expect(acceptTerms).not.toHaveBeenCalled();
    });

    it('cuando el servidor confirma, el diálogo desaparece', () => {
      const { fixture, casilla, botones, dialogo } = crear();
      acceptTerms.mockImplementation(() => {
        usuario.set({ ...cliente, termsAccepted: true }); // lo que hace AuthService.acceptTerms al tener éxito
        return of(void 0);
      });

      casilla()!.click();
      fixture.detectChanges();
      botones().find((b) => /Aceptar y continuar/.test(b.textContent ?? ''))!.click();
      fixture.detectChanges();

      expect(dialogo()).toBeNull();
    });

    it('si el servidor falla, el diálogo sigue y se puede reintentar', () => {
      acceptTerms.mockReturnValue(throwError(() => new Error('falló')));
      const { fixture, casilla, botones, dialogo } = crear();

      casilla()!.click();
      fixture.detectChanges();
      botones().find((b) => /Aceptar y continuar/.test(b.textContent ?? ''))!.click();
      fixture.detectChanges();

      expect(dialogo()).not.toBeNull();
      expect(fixture.componentInstance.saving()).toBe(false);
      expect(botones().find((b) => /Aceptar y continuar/.test(b.textContent ?? ''))!.disabled).toBe(false);
    });
  });

  it('"No acepto, cerrar sesión" cierra la sesión', () => {
    const { botones } = crear();

    botones().find((b) => /cerrar sesión/.test(b.textContent ?? ''))!.click();

    expect(logout).toHaveBeenCalledOnce();
    expect(acceptTerms).not.toHaveBeenCalled();
  });
});
