import { rateLimit } from 'express-rate-limit';

/**
 * Limitador específico para el endpoint de validación de campos únicos.
 * Previene ataques de enumeración y abuso del servidor.
 */
export const validationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 peticiones por minuto
  message: {
    status: 'error',
    message: 'Demasiadas consultas de validación desde esta IP, por favor intente de nuevo en un minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Limitador general para el login (más estricto).
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos fallidos
  message: {
    status: 'error',
    message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
