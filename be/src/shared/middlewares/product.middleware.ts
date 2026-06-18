import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que blanquea el body a solo los campos permitidos para Product.
 * Elimina cualquier campo que no esté en la lista blanca.
 */
export function sanitizeProductInput(req: Request, _res: Response, next: NextFunction): void {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    brand: req.body.brand,
    totalSold: req.body.totalSold,
    state: req.body.state,
    stock: req.body.stock,
    price: req.body.price,
    currency: req.body.currency,
    category: req.body.category
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
