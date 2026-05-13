import { AppError } from '../errors/appError.js';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Lanza AppError si las contraseñas no coinciden.
 * Se puede llamar tanto con campos presentes como undefined (UPDATE parcial).
 */
export function validatePasswords(password?: string, confirmPassword?: string): void {
  if (password && confirmPassword && password !== confirmPassword) {
    throw new AppError('Las contraseñas no coinciden', 400);
  }
}

/**
 * Lanza AppError si el error es una violación de constraint UNIQUE (MySQL / Postgres).
 * @param error Error capturado en catch
 * @param message Mensaje amigable para el usuario
 */
export function handleUniqueConstraintError(error: any, message: string): never | void {
  if (
    error.message?.includes('unique') ||
    error.message?.includes('duplicate') ||
    error.code === 'ER_DUP_ENTRY' ||
    error.code === '23505'
  ) {
    throw new AppError(message, 409);
  }
}
