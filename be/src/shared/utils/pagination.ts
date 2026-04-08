import { Request } from 'express';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/pagination.js';

/**
 * Extrae y sanea de forma segura los parámetros de paginación del Request HTTP.
 * Garantiza un límite máximo (MAX_PAGE_SIZE) para evitar DDoS o extracción masiva de datos.
 */
export function getPaginationParams(req: Request) {
  const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
  const limit = Math.min(Number.parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  return { page, limit };
}

/**
 * Construye el objeto de respuesta estructurado para la paginación.
 */
export function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
