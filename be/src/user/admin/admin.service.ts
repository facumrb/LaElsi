import { Admin } from './admin.entity.js';
import { orm } from '../../shared/db/orm.js';
import { UserRole } from '../user.entity.js';
import { AppError } from '../../shared/errors/appError.js';
import { PaginatedResult } from '../../shared/utils/pagination.interface.js';
import { DEFAULT_PAGE_SIZE } from '../../shared/config/pagination.js';
import { buildPaginatedResponse } from '../../shared/utils/pagination.js';
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH, validatePasswords, handleUniqueConstraintError } from '../../shared/validation/user-validation.utils.js';
import { USERS_PATH } from '../../shared/config/paths.config.js';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';

export interface CreateAdminDto {
  email: string;
  password?: string;
  confirmPassword?: string;
  name: string;
  lastName: string;
  phone: string;
  username: string;
  dni: string;
}

export interface UpdateAdminDto {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  dni?: string;
}

export class AdminService {
  static async getAccountInfo(id: number) {
    const em = orm.em;
    const admin = await em.findOne(Admin, { id }, { populate: ['photo'] });
    if (!admin) throw new AppError('Administrador no encontrado', 404);
    return admin;
  }

  static async findOne(id: number) {
    const em = orm.em;
    const admin = await em.findOne(Admin, { id }, { populate: ['photo'] });
    if (!admin) throw new AppError('Administrador no encontrado', 404);
    return admin;
  }

  static async findAll(page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Admin>> {
    const em = orm.em;
    const offset = (page - 1) * limit;
    const [data, total] = await em.findAndCount(
      Admin,
      {},
      { populate: ['photo'], limit, offset }
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async searchAdminByText(query: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Admin>> {
    const em = orm.em;
    if (!query || query.trim().length === 0) {
      throw new AppError('El parámetro de búsqueda es requerido', 400);
    }
    const offset = (page - 1) * limit;

    const [data, total] = await em.findAndCount(
      Admin,
      {
        $or: [{ name: { $like: `%${query}%` } }, { lastName: { $like: `%${query}%` } }, { email: { $like: `%${query}%` } }, { dni: { $like: `%${query}%` } }]
      },
      { populate: ['photo'], limit, offset }
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async addAdmin(data: CreateAdminDto) {
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

    const admin = new Admin();
    admin.email = email;
    admin.password = await bcrypt.hash(password, 10);
    admin.name = name;
    admin.lastName = lastName;
    admin.phone = phone;
    admin.username = username;
    admin.dni = dni;
    admin.role = UserRole.Admin;

    try {
      em.persist(admin);
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }

    return admin;
  }

  static async updateAdmin(id: number, input: UpdateAdminDto) {
    const em = orm.em;
    const admin = await em.findOne(Admin, { id });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

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

    em.assign(admin, input);

    try {
      await em.flush();
    } catch (error: any) {
      this.handleUniqueConstraintError(error);
      throw error;
    }

    return admin;
  }

  static async removeAdmin(id: number) {
    const em = orm.em;
    const admin = await em.findOne(Admin, { id }, { populate: ['photo'] });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    if (admin.photo) {
      // Security: strip any directory components from the DB-sourced filename
      // to prevent path traversal attacks (CWE-22). Never use raw user/DB
      // input directly in file paths.
      const safeBasename = path.basename(admin.photo.fileName);
      const resolvedPath = path.normalize(path.join(USERS_PATH, safeBasename));
      // Enforce sandbox boundary — deny if the resolved path escapes USERS_PATH
      if (!resolvedPath.startsWith(USERS_PATH + path.sep) && resolvedPath !== USERS_PATH) {
        console.warn(`Ruta de archivo inválida detectada, omitiendo eliminación.`);
      } else {
        try {
          await fs.unlink(resolvedPath);
        } catch (err) {
          console.warn(`No se pudo borrar el archivo físico: ${err}`);
        }
      }
    }

    em.remove(admin);
    await em.flush();
  }

  private static handleUniqueConstraintError(error: any) {
    handleUniqueConstraintError(error, 'Ya existe un registro con los mismos datos únicos (email, DNI o nombre de usuario)');
  }
}
