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

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}
