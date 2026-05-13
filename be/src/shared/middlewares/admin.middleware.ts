import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que blanquea el body a solo los campos permitidos para Admin.
 */
export function sanitizeAdminInput(req: Request, _res: Response, next: NextFunction): void {
  req.body.sanitizedInput = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    name: req.body.name,
    lastName: req.body.lastName,
    phone: req.body.phone,
    username: req.body.username,
    dni: req.body.dni
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}
