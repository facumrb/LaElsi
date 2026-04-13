import { orm } from '../shared/db/orm.js';
import { User, UserRole } from './user.entity.js';
import { Client } from './client/client.entity.js';
import { Admin } from './admin/admin.entity.js';
import { FiscalCondition } from '../shared/enums/fiscal-condition.enum.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../shared/middlewares/auth.middleware.js';
import { AppError } from '../shared/errors/appError.js';
import bcrypt from 'bcrypt';

export interface RegisterUserDto {
  name?: string;
  lastName?: string;
  dni?: string;
  phone?: string;

  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  cuit?: string;
  fiscalCondition?: FiscalCondition;
  street?: string;
  streetNumber?: string | number;
  city?: string;
  province?: string;
  postalCode?: string;
  floor?: string;
  apartment?: string;
}

export class UserService {
  static validatePasswords(password?: string, confirmPassword?: string) {
    if (password && confirmPassword && password !== confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400);
    }
  }

  static async verifyPassword(userId: number, passwordString: string): Promise<boolean> {
    const em = orm.em;
    const user = await em.findOne(User, { id: userId });
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const isValid = await bcrypt.compare(passwordString, user.password);
    if (!isValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    return true;
  }

  static async login(loginValue: string, passwordString: string) {
    const em = orm.em;

    if (!loginValue) {
      throw new AppError('Usuario o Email requerido', 400);
    }

    const user = await em.findOne(
      User,
      {
        $or: [{ email: loginValue }, { username: loginValue }]
      },
      {
        populate: ['photo']
      }
    );

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const isValid = await bcrypt.compare(passwordString, user.password);
    if (!isValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Generar Tokens
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      role: user.role,
      email: user.email
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        role: user.role,
        photo: user.photo
          ? {
              id: user.photo.id,
              fileName: user.photo.fileName
            }
          : null
      }
    };
  }

  static async refreshToken(refreshTokenStr: string) {
    if (!refreshTokenStr) {
      throw new AppError('Refresh token requerido', 400);
    }

    try {
      const decoded = verifyRefreshToken(refreshTokenStr);

      // Generar nuevo par de tokens
      const newToken = generateToken({
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      });

      const newRefreshToken = generateRefreshToken({
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppError('Refresh token inválido o expirado', 401);
    }
  }

  static async register(data: RegisterUserDto) {
    const em = orm.em;
    const { password, confirmPassword, ...userData } = data;

    this.validatePasswords(password, confirmPassword);

    // Verificar duplicados usando la entidad User (STI abarca Admin y Client)
    const existingUser = await em.findOne(User, {
      $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existingUser) {
      throw new AppError('El usuario o email ya existe', 400);
    }

    const newClient = new Client();
    em.assign(newClient, {
      ...userData,
      password: await bcrypt.hash(password, 10),
      role: UserRole.Client,
      streetNumber: (userData.streetNumber !== undefined && userData.streetNumber !== null)
        ? Number(userData.streetNumber)
        : undefined,
    });

    try {
      await em.persistAndFlush(newClient);
    } catch (error: any) {
      if (error.message?.includes('unique') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un registro con estos datos únicos', 409);
      }
      throw error;
    }

    return { id: newClient.id };
  }
}
