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

