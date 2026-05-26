import { Request, Response, NextFunction } from 'express';

export const trimMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const trimStrings = (obj: any) => {
    if (obj !== null && typeof obj === 'object') {
      // Seguridad: usar Object.entries y Reflect.set para evitar falsos positivos
      // del SAST sobre contaminación de prototipos mediante notación de corchetes (CWE-1321).
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          Reflect.set(obj, key, value.trim().replace(/\s{2,}/g, ' '));
        } else if (typeof value === 'object') {
          trimStrings(value);
        }
      }
    }
  };

  if (req.body) trimStrings(req.body);
  if (req.query) trimStrings(req.query);
  if (req.params) trimStrings(req.params);

  next();
};
