import { Client } from './client.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/appError.js';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';

const USERS_PATH = path.join(process.cwd(), 'uploads', 'users');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

import { FiscalCondition } from '../../shared/enums/fiscal-condition.enum.js';

export interface CreateClientDto {
  email: string;
  password?: string;
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

  static async findAll() {
    const em = orm.em;
    return em.find(Client, {}, { populate: ['photo'] });
  }

  static async searchClientByText(query: string) {
    const em = orm.em;
    if (!query || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }

    return em.find(
      Client,
      {
        $or: [{ name: { $like: `%${query}%` } }, { lastName: { $like: `%${query}%` } }, { username: { $like: `%${query}%` } }, { dni: { $like: `%${query}%` } }]
      },
      { populate: ['photo'] }
    );
  }

  static async addClient(data: CreateClientDto) {
    const em = orm.em;
    const { email, password, name, lastName, phone, username, dni } = data;

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

    try {
      em.persist(client);
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }

    const token = jwt.sign({ id: client.id, role: client.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h'
    });

    return {
      token,
      user: {
        id: client.id,
        email: client.email,
        firstName: client.name,
        lastName: client.lastName,
        role: client.role
      }
    };
  }

  static async updateClient(id: number, input: UpdateClientDto) {
    const em = orm.em;
    const client = await em.findOne(Client, { id });
    if (!client) throw new AppError('Cliente no encontrado', 404);

    if (input.email !== undefined && !EMAIL_REGEX.test(input.email)) {
      throw new AppError('El formato del correo electrónico es inválido', 400);
    }

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
      const filePath = path.join(USERS_PATH, client.photo.fileName);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(`No se pudo borrar el archivo físico: ${err}`);
      }
    }

    em.remove(client);
    await em.flush();
  }

  private static handleUniqueConstraintError(error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      throw new AppError('Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)', 409);
    }
  }
}
