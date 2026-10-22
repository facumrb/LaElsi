import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSession } from '@models/auth.model';
import { UserRole } from '@models/user.model';
import { AlertService } from './alert.service';
import { AuthService } from './auth.service';
import { CurrentPasswordService } from './current-password.service';

// El servidor exige la contraseña actual para que alguien cambie el email o la contraseña de SU PROPIA
// cuenta (con solo la sesión iniciada no alcanza). Este servicio decide cuándo pedirla en pantalla.
describe('CurrentPasswordService', () => {
  const sesion = (hasPassword?: boolean): UserSession => ({
    id: 2,
    name: 'Ana',
    lastName: 'Pérez',
    role: UserRole.Client,
    hasPassword,
  });

  const usuario = signal<UserSession | null>(sesion(true));
  const askCurrentPassword = vi.fn();

  beforeEach(() => {
    usuario.set(sesion(true));
    askCurrentPassword.mockReset().mockResolvedValue('mi-clave-actual1');
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser: usuario } },
        { provide: AlertService, useValue: { askCurrentPassword } },
      ],
    });
  });

  const servicio = () => TestBed.inject(CurrentPasswordService);
  const propia = { editingOwnAccount: true, changesEmail: false, changesPassword: false };

  it('cambiando MI email la pide y la devuelve', async () => {
    const actual = await servicio().requestIfNeeded({ ...propia, changesEmail: true });

    expect(actual).toBe('mi-clave-actual1');
    expect(askCurrentPassword).toHaveBeenCalledOnce();
    expect(askCurrentPassword.mock.calls[0][0]).toMatch(/tu email/);
  });

  it('cambiando MI contraseña la pide', async () => {
    expect(await servicio().requestIfNeeded({ ...propia, changesPassword: true })).toBe('mi-clave-actual1');
    expect(askCurrentPassword.mock.calls[0][0]).toMatch(/tu contraseña/);
  });

  it('cambiando las dos cosas pide una sola vez y lo dice', async () => {
    await servicio().requestIfNeeded({ ...propia, changesEmail: true, changesPassword: true });

    expect(askCurrentPassword).toHaveBeenCalledOnce();
    expect(askCurrentPassword.mock.calls[0][0]).toMatch(/tu email y tu contraseña/);
  });

  it('si la persona cancela devuelve null: no hay que guardar nada', async () => {
    askCurrentPassword.mockResolvedValue(null);

    expect(await servicio().requestIfNeeded({ ...propia, changesEmail: true })).toBeNull();
  });

  it('editando otras cosas (nombre, teléfono...) no la pide', async () => {
    expect(await servicio().requestIfNeeded(propia)).toBeUndefined();
    expect(askCurrentPassword).not.toHaveBeenCalled();
  });

  it('un administrador que edita a OTRA persona no la necesita, aunque cambie el email o la contraseña', async () => {
    const resultado = await servicio().requestIfNeeded({ editingOwnAccount: false, changesEmail: true, changesPassword: true });

    expect(resultado).toBeUndefined();
    expect(askCurrentPassword).not.toHaveBeenCalled();
  });

  it('una cuenta de solo Google (sin contraseña) no tiene nada que confirmar', async () => {
    usuario.set(sesion(false));

    expect(await servicio().requestIfNeeded({ ...propia, changesEmail: true })).toBeUndefined();
    expect(askCurrentPassword).not.toHaveBeenCalled();
  });

  it('si todavía no se sabe si tiene contraseña (sesión vieja), la pide: el servidor decide', async () => {
    usuario.set(sesion(undefined));

    expect(await servicio().requestIfNeeded({ ...propia, changesEmail: true })).toBe('mi-clave-actual1');
  });
});
