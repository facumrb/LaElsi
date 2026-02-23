import { Request, Response } from 'express';
import { orm } from '../db/orm.js';
import { asyncHandler } from '../errors/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
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

export class ValidationController {
  static validateUnique = asyncHandler(async (req: Request, res: Response) => {
    const { entity, field, value, excludeId } = req.query;

    if (!entity || !field || value === undefined) {
      throw new AppError('Faltan parámetros requeridos (entity, field, value)', 400);
    }

    const EntityClass = ENTITY_MAP[entity as string];
    if (!EntityClass) {
      throw new AppError(`Entidad '${entity}' no soportada para validación única`, 400);
    }

    const allowedFields = ALLOWED_FIELDS[entity as string];
    if (!allowedFields || !allowedFields.includes(field as string)) {
      throw new AppError(`El campo '${field}' no está permitido para validación única en '${entity}'`, 400);
    }

    let normalizedValue = value as string;
    if (['email', 'username'].includes(field as string)) {
      normalizedValue = normalizedValue.trim().toLowerCase();
    }

    const em = orm.em;
    const filter: any = { [field as string]: normalizedValue };

    if (excludeId) {
      const id = Number.parseInt(excludeId as string);
      if (!isNaN(id)) {
        filter.id = { $ne: id };
      }
    }

    const count = await em.count(EntityClass, filter);
    const available = count === 0;

    const isSensitive = SENSITIVE_FIELDS.includes(field as string);
    const message = available
      ? 'Campo disponible'
      : isSensitive
        ? 'Este valor no está disponible'
        : `El ${field} ya está en uso`;

    return res.status(200).json(
      ApiResponse.success('Verificación completada', {
        available,
        message
      })
    );
  });
}
