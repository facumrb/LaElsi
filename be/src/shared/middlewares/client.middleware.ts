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

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (
      req.body.sanitizedInput[key] === undefined ||
      (key === 'cuit' && req.body.sanitizedInput[key] === '')
    ) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}
