import { orm } from '../shared/db/orm.js';
import { User, UserRole } from './user.entity.js';
import { Client } from './client/client.entity.js';
import { Admin } from './admin/admin.entity.js';
import { FiscalCondition } from '../shared/enums/fiscal-condition.enum.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../shared/middlewares/auth.middleware.js';
import { AppError } from '../shared/errors/appError.js';
import bcrypt from 'bcrypt';

export interface RegisterUserDto {
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  username: string;
  password: string;
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
    const { name, lastName, dni, phone, username, password, email, cuit, fiscalCondition, ...addressFields } = data;

    // Verificar duplicados (email o username) en ambas tablas
    const existingAdmin = await em.findOne(Admin, { $or: [{ email }, { username }] });
    const existingClient = await em.findOne(Client, { $or: [{ email }, { username }] });

    if (existingAdmin || existingClient) {
      throw new AppError('El usuario o email ya existe', 400);
    }

    // Crear Cliente por defecto
    const newClient = new Client();
    newClient.name = name;
    newClient.lastName = lastName;
    newClient.dni = dni;
    newClient.phone = phone;
    newClient.username = username;
    newClient.email = email;
    newClient.role = UserRole.Client;

    // Asignar campos de facturación si vienen
    if (cuit) newClient.cuit = cuit;
    if (fiscalCondition) newClient.fiscalCondition = fiscalCondition;

    // Asignar campos de dirección si vienen
    if (addressFields.street) newClient.street = addressFields.street;
    if (addressFields.streetNumber) newClient.streetNumber = Number(addressFields.streetNumber);
    if (addressFields.city) newClient.city = addressFields.city;
    if (addressFields.province) newClient.province = addressFields.province;
    if (addressFields.postalCode) newClient.postalCode = addressFields.postalCode;
    if (addressFields.floor) newClient.floor = addressFields.floor;
    if (addressFields.apartment) newClient.apartment = addressFields.apartment;

    newClient.password = await bcrypt.hash(password, 10);

    em.persist(newClient);
    try {
      await em.flush();
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)', 409);
      }
      throw error;
    }

    return { id: newClient.id };
  }
}
