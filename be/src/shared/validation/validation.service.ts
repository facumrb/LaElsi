import { orm } from '../db/orm.js';
import { AppError } from '../errors/appError.js';
import { Admin } from '../../user/admin/admin.entity.js';
import { Client } from '../../user/client/client.entity.js';
import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';

const ENTITY_MAP: Record<string, any> = {
  Admin,
  Client,
  Category,
  Product
};

const ALLOWED_FIELDS: Record<string, string[]> = {
  Admin: ['email', 'username', 'dni'],
  Client: ['email', 'username', 'dni', 'cuit'],
  Category: ['name'],
  Product: ['name']
};

const SENSITIVE_FIELDS = ['email', 'username', 'dni', 'cuit'];

export class ValidationService {
  static async validateUnique(entity: string, field: string, value: string, excludeId?: string) {
    if (!entity || !field || value === undefined) {
      throw new AppError('Faltan parámetros requeridos (entity, field, value)', 400);
    }

    const EntityClass = ENTITY_MAP[entity];
    if (!EntityClass) {
      throw new AppError(`Entidad '${entity}' no soportada para validación única`, 400);
    }

    const allowedFields = ALLOWED_FIELDS[entity];
    if (!allowedFields || !allowedFields.includes(field)) {
      throw new AppError(`El campo '${field}' no está permitido para validación única en '${entity}'`, 400);
    }

    let normalizedValue = value;
    if (['email', 'username'].includes(field)) {
      normalizedValue = normalizedValue.trim().toLowerCase();
    }

    const em = orm.em;
    const filter: any = { [field]: normalizedValue };

    if (excludeId) {
      const id = Number.parseInt(excludeId);
      if (!isNaN(id)) {
        filter.id = { $ne: id };
      }
    }

    const count = await em.count(EntityClass, filter);
    const available = count === 0;

    const isSensitive = SENSITIVE_FIELDS.includes(field);
    const message = available
      ? 'Campo disponible'
      : isSensitive
        ? 'Este valor no está disponible'
        : `El ${field} ya está en uso`;

    return { available, message };
  }
}
