import { Client } from './client.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';
import { AppError } from '../../shared/errors/appError.js';
import { PaginatedResult } from '../../shared/utils/pagination.interface.js';
import { DEFAULT_PAGE_SIZE } from '../../shared/config/pagination.js';
import { buildPaginatedResponse } from '../../shared/utils/pagination.js';
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH, validatePasswords, handleUniqueConstraintError } from '../../shared/validation/user-validation.utils.js';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { USERS_PATH } from '../../shared/config/paths.config.js';
import { FiscalCondition } from '../../shared/enums/fiscal-condition.enum.js';

export interface CreateClientDto {
  email: string;
  password?: string;
  confirmPassword?: string;
  name: string;
  lastName: string;
  phone: string;
  username: string;
  dni: string;
  cuit?: string;
  fiscalCondition?: FiscalCondition;
  street?: string;
  streetNumber?: number;
  city?: string;
  province?: string;
  postalCode?: string;
  floor?: string;
  apartment?: string;
}

export interface UpdateClientDto {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  dni?: string;
  cuit?: string;
  fiscalCondition?: FiscalCondition;
  street?: string;
  streetNumber?: number;
  city?: string;
  province?: string;
  postalCode?: string;
  floor?: string;
  apartment?: string;
}

export class ClientService {
  static async getAccountInfo(id: number) {
    const em = orm.em;
    const client = await em.findOne(
      Client,
      { id },
      {
        populate: ['photo', 'orders']
      }
    );

    if (!client) throw new AppError('Cliente no encontrado', 404);
    return client;
  }

  static async findOne(id: number) {
    const em = orm.em;
    const client = await em.findOne(
      Client,
      { id },
      {
        populate: ['photo', 'orders']
      }
    );
    if (!client) throw new AppError('Cliente no encontrado', 404);
    return client;
  }

  static async findAll(page: number = 1, limit: number = DEFAULT_PAGE_SIZE, fiscalCondition?: string): Promise<PaginatedResult<Client>> {
    const em = orm.em;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (fiscalCondition) {
      where.fiscalCondition = fiscalCondition;
    }
    const [data, total] = await em.findAndCount(Client, where, { populate: ['photo'], limit, offset });
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async searchClientByText(query: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Client>> {
    const em = orm.em;
    if (!query || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }
    const offset = (page - 1) * limit;

    const [data, total] = await em.findAndCount(
      Client,
      {
        $or: [{ name: { $like: `%${query}%` } }, { lastName: { $like: `%${query}%` } }, { username: { $like: `%${query}%` } }, { dni: { $like: `%${query}%` } }]
      },
      { populate: ['photo'], limit, offset }
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async addClient(data: CreateClientDto) {
    const em = orm.em;
    const { email, password, confirmPassword, name, lastName, phone, username, dni } = data;

    validatePasswords(password, confirmPassword);

    if (!email || !password || !name || !lastName || !phone || !username || !dni) {
      throw new AppError('Todos los campos obligatorios deben ser proporcionados (email, contraseña, nombre, apellido, teléfono, nombre de usuario, DNI)', 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError('El formato del correo electrónico es inválido', 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
    }

    const client = new Client();
    client.email = email;
    client.password = await bcrypt.hash(password, 10);
    client.name = name;
    client.lastName = lastName;
    client.phone = phone;
    client.username = username;
    client.dni = dni;
    client.role = UserRole.Client;

    if (data.cuit) client.cuit = data.cuit;
    if (data.fiscalCondition) client.fiscalCondition = data.fiscalCondition;
    if (data.street) client.street = data.street;
    if (data.streetNumber) client.streetNumber = data.streetNumber;
    if (data.city) client.city = data.city;
    if (data.province) client.province = data.province;
    if (data.postalCode) client.postalCode = data.postalCode;
    if (data.floor) client.floor = data.floor;
    if (data.apartment) client.apartment = data.apartment;

    try {
      em.persist(client);
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }

    return {
      id: client.id,
      email: client.email,
      firstName: client.name,
      lastName: client.lastName,
      role: client.role
    };
  }

  static async updateClient(id: number, input: UpdateClientDto) {
    const em = orm.em;
    const client = await em.findOne(Client, { id });
    if (!client) throw new AppError('Cliente no encontrado', 404);

    if (input.email !== undefined && !EMAIL_REGEX.test(input.email)) {
      throw new AppError('El formato del correo electrónico es inválido', 400);
    }

    validatePasswords(input.password, input.confirmPassword);

    if (input.password) {
      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
      }
      input.password = await bcrypt.hash(input.password, 10);
    }

    em.assign(client, input);

    try {
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }

    return client;
  }

  static async removeClient(id: number) {
    const em = orm.em;
    const client = await em.findOne(Client, { id }, { populate: ['photo'] });
    if (!client) throw new AppError('Cliente no encontrado', 404);

    if (client.photo) {
      const joinedPath = path.join(USERS_PATH, client.photo.fileName);
      // Normalize path, removing any '..'
      const fullPath = path.normalize(joinedPath);
      // Verify the fullPath is contained within our basePath
      if (!fullPath.startsWith(USERS_PATH)) {
        console.warn('Invalid path specified!');
      } else {
        try {
          await fs.unlink(fullPath);
        } catch (err) {
          console.warn(`No se pudo borrar el archivo físico: ${err}`);
        }
      }
    }

    em.remove(client);
    await em.flush();
  }

  private static handleUniqueConstraintError(error: any) {
    handleUniqueConstraintError(error, 'Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)');
  }
}
