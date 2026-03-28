import { Request, Response, NextFunction } from 'express';

export const trimMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const trimStrings = (obj: any) => {
    if (obj !== null && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (typeof value === 'string') {
          obj[key] = value.trim().replace(/\s{2,}/g, ' ');
        } else if (typeof value === 'object') {
          trimStrings(obj[key]);
        }
      });
    }
  };

  if (req.body) trimStrings(req.body);
  if (req.query) trimStrings(req.query);
  if (req.params) trimStrings(req.params);

  next();
};
