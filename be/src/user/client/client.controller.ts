import { Request, Response, NextFunction } from 'express';
import { Client } from './client.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import fs from 'fs/promises';
import path from 'path';

const USERS_PATH = path.join(process.cwd(), 'uploads', 'users');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function sanitizeClientInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    dni: req.body.dni,
    cuit: req.body.cuit,
    fiscalCondition: req.body.fiscalCondition,
    street: req.body.street,
    streetNumber: req.body.streetNumber,
    city: req.body.city,
    province: req.body.province,
    postalCode: req.body.postalCode,
    floor: req.body.floor,
    apartment: req.body.apartment
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

export class ClientController {

  static getAccountInfo = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

    const client = await em.findOne(
      Client,
      { id },
      { populate: ['orders'] }
    );

    if (!client) throw new AppError('Cliente no encontrado', 404);

    return res.status(200).send({
      message: 'Cuenta encontrada',
      data: client
    });
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

    const client = await em.findOne(Client, { id });
    if (!client) throw new AppError('Cliente no encontrado', 404);

    return res.status(200).json({
      message: 'Cliente encontrado',
      data: client
    });
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const clients = await em.find(Client, {});

    return res.status(200).json({
      message: 'Todos los Clientes fueron encontrados',
      data: clients
    });
  });

  static searchClientByText = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }

    const clients = await em.find(Client, {
      $or: [
        { name: { $like: `%${query}%` } },
        { last_name: { $like: `%${query}%` } },
        { email: { $like: `%${query}%` } },
        { dni: { $like: `%${query}%` } }
      ]
    });

    return res.status(200).json({
      message: 'Resultados de búsqueda',
      data: clients
    });
  });

  static add = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const { email, password, name, last_name, phone, username, dni } = req.body.sanitizedInput;

    // Validar campos obligatorios
    if (!email || !password || !name || !last_name || !phone || !username || !dni) {
      throw new AppError('Todos los campos obligatorios deben ser proporcionados (email, contraseña, nombre, apellido, teléfono, nombre de usuario, DNI)', 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError('El formato del correo electrónico es inválido', 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
    }

    const existingByEmail = await em.findOne(Client, { email });
    if (existingByEmail) {
      throw new AppError('El correo electrónico ya está registrado', 400);
    }

    const existingByUsername = await em.findOne(Client, { username });
    if (existingByUsername) {
      throw new AppError('El nombre de usuario ya está en uso', 400);
    }

    const existingByDni = await em.findOne(Client, { dni });
    if (existingByDni) {
      throw new AppError('El DNI ya está registrado', 400);
    }

    const client = new Client();
    client.email = email;
    await client.setPassword(password);
    client.name = name;
    client.last_name = last_name;
    client.phone = phone;
    client.username = username;
    client.dni = dni;
    client.role = UserRole.CLIENT;

    try {
      await em.persistAndFlush(client);
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)', 409);
      }
      throw error;
    }

    const token = jwt.sign({ id: client.id, role: client.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h'
    });

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        user: {
          id: client.id,
          email: client.email,
          firstName: client.name,
          lastName: client.last_name,
          role: client.role
        }
      }
    });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

    const client = await em.findOne(Client, { id });
    if (!client) throw new AppError('Cliente no encontrado', 404);

    const input = req.body.sanitizedInput;

    if (input.email !== undefined && !EMAIL_REGEX.test(input.email)) {
      throw new AppError('El formato del correo electrónico es inválido', 400);
    }

    if (input.password) {
      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
      }
      await client.setPassword(input.password);
      delete input.password;
    }

    em.assign(client, input);

    try {
      await em.flush();
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)', 409);
      }
      throw error;
    }

    return res.status(200).json({
      message: 'Datos actualizados correctamente',
      data: client
    });
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

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

    return res.status(200).json({
      message: 'Cliente eliminado correctamente'
    });
  });
}

export { sanitizeClientInput };
