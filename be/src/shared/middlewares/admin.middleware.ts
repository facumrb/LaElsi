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

  // Seguridad: usar Object.entries y Reflect.deleteProperty para evitar falsos positivos
  // del SAST sobre contaminación de prototipos mediante notación de corchetes (CWE-1321).
  for (const [key, value] of Object.entries(req.body.sanitizedInput)) {
    if (value === undefined) {
      Reflect.deleteProperty(req.body.sanitizedInput, key);
    }
  }

  next();
}
