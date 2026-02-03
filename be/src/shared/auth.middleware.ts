import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../user/user.entity.js';

// Extender la interfaz Request para incluir el usuario decodificado
declare global {
    namespace Express {
        interface Request {
            user?: { id: number; role: UserRole; email: string };
        }
    }
}

const SECRET = process.env.JWT_SECRET || 'secret_super_secreto_para_desarrollo';

// Middleware para verificar si el usuario tiene un Token válido
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Esperamos "Bearer TOKEN"

    if (!token) {
        return res.status(403).json({ message: 'Token no proporcionado' });
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
    return jwt.sign(user, SECRET, { expiresIn: '8h' });
}
