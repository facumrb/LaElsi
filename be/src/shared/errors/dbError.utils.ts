import { AppError } from './appError.js';

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
