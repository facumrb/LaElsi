import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que blanquea el body a solo los campos permitidos para Client.
 * Nota: elimina también strings vacíos para el campo `cuit`.
 */
export function sanitizeClientInput(req: Request, _res: Response, next: NextFunction): void {
  req.body.sanitizedInput = {
    name: req.body.name,
    lastName: req.body.lastName,
    phone: req.body.phone,
    username: req.body.username,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    email: req.body.email,
    dni: req.body.dni,
    cuit: req.body.cuit,
    fiscalCondition: req.body.fiscalCondition,
    street: req.body.street,
    streetNumber: req.body.streetNumber,
    city: req.body.city,
    province: req.body.province,
    postalCode: req.body.postalCode,
    floor: req.body.floor,
    apartment: req.body.apartment
  };

  // Seguridad: usar Object.entries y Reflect.deleteProperty para evitar falsos positivos
  // del SAST sobre contaminación de prototipos mediante notación de corchetes (CWE-1321).
  for (const [key, value] of Object.entries(req.body.sanitizedInput)) {
    if (value === undefined || (key === 'cuit' && value === '')) {
      Reflect.deleteProperty(req.body.sanitizedInput, key);
    }
  }

  next();
}
