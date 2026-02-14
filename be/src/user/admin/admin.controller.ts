import { Request, Response, NextFunction } from 'express';
import { Admin } from './admin.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function sanitizeAdminInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    address: req.body.address,
    username: req.body.username,
    dni: req.body.dni
  };
  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

export class AdminController {

  static getAccountInfo = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    const admin = await em.findOne(Admin, { id });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    return res.status(200).json({
      message: 'Información de cuenta obtenida',
      data: admin
    });
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    const admin = await em.findOne(Admin, { id });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    return res.status(200).json({
      message: 'Administrador encontrado',
      data: admin
    });
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const admins = await em.find(Admin, {});

    return res.status(200).json({
      message: 'Todos los Administradores fueron encontrados',
      data: admins
    });
  });

  static searchAdminByText = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }

    const admins = await em.find(Admin, {
      $or: [
        { name: { $like: `%${query}%` } },
        { last_name: { $like: `%${query}%` } },
        { email: { $like: `%${query}%` } },
        { dni: { $like: `%${query}%` } }
      ]
    });

    return res.status(200).json({
      message: 'Resultados de búsqueda',
      data: admins
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

    const existingByEmail = await em.findOne(Admin, { email });
    if (existingByEmail) {
      throw new AppError('El correo electrónico ya está registrado', 400);
    }

    const existingByUsername = await em.findOne(Admin, { username });
    if (existingByUsername) {
      throw new AppError('El nombre de usuario ya está en uso', 400);
    }

    const existingByDni = await em.findOne(Admin, { dni });
    if (existingByDni) {
      throw new AppError('El DNI ya está registrado', 400);
    }

    const admin = new Admin();
    admin.email = email;
    await admin.setPassword(password);
    admin.name = name;
    admin.last_name = last_name;
    admin.phone = phone;
    admin.username = username;
    admin.dni = dni;
    admin.role = UserRole.ADMIN;

    try {
      await em.persistAndFlush(admin);
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)', 409);
      }
      throw error;
    }

    return res.status(201).json({
      message: 'Administrador creado',
      data: admin
    });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    const admin = await em.findOne(Admin, { id });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    const input = req.body.sanitizedInput;

    if (input.email !== undefined && !EMAIL_REGEX.test(input.email)) {
      throw new AppError('El formato del correo electrónico es inválido', 400);
    }

    if (input.password) {
      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
      }
      await admin.setPassword(input.password);
      delete input.password;
    }

    em.assign(admin, input);

    try {
      await em.flush();
    } catch (error: any) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new AppError('Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)', 409);
      }
      throw error;
    }

    return res.status(200).json({
      message: 'Administrador actualizado',
      data: admin
    });
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    const admin = await em.findOne(Admin, { id });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    em.remove(admin);
    await em.flush();

    return res.status(200).json({
      message: 'Administrador eliminado'
    });
  });
}

export { sanitizeAdminInput };
