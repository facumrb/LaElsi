import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRevocationService } from '@services/api-services/api-revocation.service';
import { AlertService } from '@services/alert.service';
import { RevocationPageComponent } from './revocation-page.component';

// Botón de arrepentimiento (Res. 424/2020): la norma pide que se pueda usar SIN registrarse
// y que se informe al instante un código de identificación.
describe('RevocationPageComponent', () => {
  const datosMinimos = {
    firstName: 'María',
    lastName: 'Gómez',
    email: 'maria@example.com',
    phone: '',
    orderNumber: '',
    details: 'Compré una mochila el lunes y quiero devolverla.',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
    // jsdom no implementa scrollTo
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  function crear() {
    const fixture = TestBed.createComponent(RevocationPageComponent);
    const componente = fixture.componentInstance;
    // El token de Turnstile lo emite el widget real: acá se da por verificado
    componente.turnstileToken.set('token-de-prueba');
    return { fixture, componente };
  }

  describe('validaciones', () => {
    function valido(cambios: Partial<typeof datosMinimos> = {}): boolean {
      const { componente } = crear();
      componente.form.setValue({ ...datosMinimos, ...cambios });
      return componente.form.valid;
    }

    it('acepta los datos mínimos: teléfono y número de pedido son opcionales', () => {
      expect(valido()).toBe(true);
    });

    it('acepta teléfono y número de pedido bien escritos', () => {
      expect(valido({ phone: '+54 341 712-1860', orderNumber: '1234' })).toBe(true);
    });

    it('acepta un email con mayúsculas: no tiene que trabar a quien ejerce un derecho', () => {
      expect(valido({ email: 'Maria.Gomez@Example.com' })).toBe(true);
    });

    it.each([
      ['sin nombre', { firstName: '' }],
      ['sin apellido', { lastName: '' }],
      ['sin email', { email: '' }],
      ['con un email inválido', { email: 'maria@' }],
      ['con un email con espacios', { email: 'maria gomez@example.com' }],
      ['sin detalle', { details: '' }],
      ['con un detalle de menos de 10 caracteres', { details: 'quiero' }],
      ['con un detalle de más de 1000 caracteres', { details: 'a'.repeat(1001) }],
      ['con un teléfono con letras', { phone: '341-abc' }],
      ['con un número de pedido con letras', { orderNumber: '12ab' }],
    ])('rechaza el formulario %s', (_caso, cambios) => {
      expect(valido(cambios)).toBe(false);
    });
  });

  describe('al enviar', () => {
    it('manda los datos con teléfono y pedido en null cuando se dejan vacíos', () => {
      const crearSolicitud = vi
        .spyOn(TestBed.inject(ApiRevocationService), 'create')
        .mockReturnValue(of({ code: 'ARR-000007' }));
      const { componente } = crear();

      componente.form.setValue(datosMinimos);
      componente.onSubmit();

      expect(crearSolicitud).toHaveBeenCalledExactlyOnceWith(
        {
          firstName: 'María',
          lastName: 'Gómez',
          email: 'maria@example.com',
          phone: null,
          orderNumber: null,
          details: 'Compré una mochila el lunes y quiero devolverla.',
        },
        'token-de-prueba',
      );
    });

    it('manda el número de pedido como número y el teléfono como texto', () => {
      const crearSolicitud = vi
        .spyOn(TestBed.inject(ApiRevocationService), 'create')
        .mockReturnValue(of({ code: 'ARR-000007' }));
      const { componente } = crear();

      componente.form.setValue({ ...datosMinimos, phone: '341 712-1860', orderNumber: '42' });
      componente.onSubmit();

      const [datos] = crearSolicitud.mock.calls[0];
      expect(datos.orderNumber).toBe(42);
      expect(datos.phone).toBe('341 712-1860');
    });

    it('muestra el código de identificación en pantalla apenas responde el servidor', () => {
      vi.spyOn(TestBed.inject(ApiRevocationService), 'create').mockReturnValue(
        of({ code: 'ARR-000007' }),
      );
      const { fixture, componente } = crear();

      componente.form.setValue(datosMinimos);
      componente.onSubmit();
      fixture.detectChanges();

      expect(componente.code()).toBe('ARR-000007');
      expect(fixture.nativeElement.textContent).toContain('ARR-000007');
      expect(fixture.nativeElement.textContent).toContain('maria@example.com');
    });

    it('con el formulario inválido no llama al servidor', () => {
      const crearSolicitud = vi.spyOn(TestBed.inject(ApiRevocationService), 'create');
      const { componente } = crear();

      componente.form.setValue({ ...datosMinimos, email: 'no-es-un-email' });
      componente.onSubmit();

      expect(crearSolicitud).not.toHaveBeenCalled();
      expect(componente.code()).toBeNull();
    });

    it('si la verificación anti-bots no terminó, avisa y no llama al servidor', () => {
      const crearSolicitud = vi.spyOn(TestBed.inject(ApiRevocationService), 'create');
      const aviso = vi
        .spyOn(TestBed.inject(AlertService), 'modal')
        .mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false });
      const { componente } = crear();

      componente.turnstileToken.set(null);
      componente.form.setValue(datosMinimos);
      componente.onSubmit();

      expect(aviso).toHaveBeenCalledOnce();
      expect(crearSolicitud).not.toHaveBeenCalled();
    });

    it('si el servidor falla, no muestra ningún código y deja volver a intentar', () => {
      vi.spyOn(TestBed.inject(ApiRevocationService), 'create').mockReturnValue(
        throwError(() => new Error('falló')),
      );
      const { componente } = crear();

      componente.form.setValue(datosMinimos);
      componente.onSubmit();

      expect(componente.code()).toBeNull();
      expect(componente.loading()).toBe(false);
    });
  });
});
