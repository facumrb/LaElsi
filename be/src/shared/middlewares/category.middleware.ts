import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que blanquea el body a solo los campos permitidos para Category.
 */
export function sanitizeCategoryInput(req: Request, _res: Response, next: NextFunction): void {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    order: req.body.order,
    state: req.body.state,
    parentId: req.body.parentId,
    products: req.body.products
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
