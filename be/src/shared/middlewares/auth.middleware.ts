import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../user/user.entity.js';

// Extender la interfaz Request para incluir el usuario decodificado
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: UserRole; email: string };
    }
  }
}

const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!SECRET || !REFRESH_SECRET) {
  console.error("ERROR CRÍTICO: Las variables JWT_SECRET y JWT_REFRESH_SECRET deben estar obligatoriamente definidas en tu archivo .env");
  process.exit(1); // Volteamos la app para evitar que arranque insegura
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Middleware para verificar si el usuario tiene un Token válido
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Esperamos "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, SECRET) as { id: number; role: UserRole; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar Rol (Autorización)
// Ejemplo de uso: verifyRole([UserRole.ADMIN])
export const verifyRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: No tienes permisos suficientes' });
    }

    next();
  };
};

export const generateToken = (user: { id: number; role: UserRole; email: string }) => {
  return jwt.sign(user, SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (user: { id: number; role: UserRole; email: string }) => {
  return jwt.sign(user, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const verifyRefreshToken = (token: string): { id: number; role: UserRole; email: string } => {
  return jwt.verify(token, REFRESH_SECRET) as { id: number; role: UserRole; email: string };
};

