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

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}
