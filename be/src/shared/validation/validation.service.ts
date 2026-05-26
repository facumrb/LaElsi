import { orm } from '../db/orm.js';
import { AppError } from '../errors/appError.js';
import { Admin } from '../../user/admin/admin.entity.js';
import { Client } from '../../user/client/client.entity.js';
import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';

// Seguridad: usar Map en lugar de un objeto plano para que las búsquedas nunca recorran la
// cadena de prototipos. A diferencia de la notación de corchetes en un objeto plano, Map.get() almacena
// las entradas en una ranura interna — map.get('__proto__') siempre devuelve undefined
// y no puede acceder a Object.prototype (CWE-1321).
const ENTITY_MAP = new Map<string, any>([
  ['Admin', Admin],
  ['Client', Client],
  ['Category', Category],
  ['Product', Product],
]);

const ALLOWED_FIELDS = new Map<string, string[]>([
  ['Admin', ['email', 'username', 'dni']],
  ['Client', ['email', 'username', 'dni', 'cuit']],
  ['Category', ['name']],
  ['Product', ['name']],
]);

const SENSITIVE_FIELDS = ['email', 'username', 'dni', 'cuit'];

// Seguridad: lista de denegación de defensa en profundidad para claves de contaminación de prototipos (CWE-1321).
// Map.get() ya hace que esto sea innecesario, pero un rechazo temprano produce un
// registro de auditoría más limpio y protege contra futuros cambios en el código.
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export class ValidationService {
  static async validateUnique(entity: string, field: string, value: string, excludeId?: string) {
    if (!entity || !field || value === undefined) {
      throw new AppError('Faltan parámetros requeridos (entity, field, value)', 400);
    }

    // Defensa en profundidad: rechazar claves de contaminación de prototipos inmediatamente.
    if (FORBIDDEN_KEYS.has(entity) || FORBIDDEN_KEYS.has(field)) {
      throw new AppError('Parámetros inválidos', 400);
    }

    // Map.get() nunca toca la cadena de prototipos — seguro con entrada de usuario.
    const EntityClass = ENTITY_MAP.get(entity);
    if (!EntityClass) {
      throw new AppError(`Entidad '${entity}' no soportada para validación única`, 400);
    }

    const allowedFields = ALLOWED_FIELDS.get(entity);
    if (!allowedFields || !allowedFields.includes(field)) {
      throw new AppError(`El campo '${field}' no está permitido para validación única en '${entity}'`, 400);
    }

    let normalizedValue = value;
    if (['email', 'username'].includes(field)) {
      normalizedValue = normalizedValue.trim().toLowerCase();
    }

    const em = orm.em;
    // 'field' está validado contra la lista permitida de arriba y no es una clave de
    // prototipo prohibida, por lo que la notación de corchetes aquí es segura.
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

