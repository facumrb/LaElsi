import { Request, Response, NextFunction } from 'express';
import { AppError } from './appError.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Configuración predeterminada para errores no controlados
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // En desarrollo queremos ver el stack trace completo
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // En producción:
    // 1) Errores operacionales confiables: enviar mensaje al cliente
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // 2) Errores de programación u otros desconocidos: no filtrar detalles del error
      console.error('ERROR', err);
      res.status(500).json({
        status: 'error',
        message: 'Algo salió muy mal!'
      });
    }
  }
};
