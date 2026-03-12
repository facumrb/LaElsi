import { Request, Response, NextFunction } from 'express';
import { AdminService, CreateAdminDto, UpdateAdminDto } from './admin.service.js';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';

function sanitizeAdminInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    lastName: req.body.lastName,
    phone: req.body.phone,
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
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    const admin = await AdminService.getAccountInfo(id);
    return res.status(200).json(ApiResponse.success('Información de cuenta obtenida', admin));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    const admin = await AdminService.findOne(id);
    return res.status(200).json(ApiResponse.success('Administrador encontrado', admin));
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const admins = await AdminService.findAll();
    return res.status(200).json(ApiResponse.success('Todos los Administradores fueron encontrados', admins));
  });

  static searchAdminByText = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;
    const admins = await AdminService.searchAdminByText(query as string);
    return res.status(200).json(ApiResponse.success('Resultados de búsqueda', admins));
  });

  static add = asyncHandler(async (req: Request, res: Response) => {
    const adminData: CreateAdminDto = req.body.sanitizedInput;
    const admin = await AdminService.addAdmin(adminData);
    return res.status(201).json(ApiResponse.created('Administrador creado', admin));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    const adminData: UpdateAdminDto = req.body.sanitizedInput;
    const admin = await AdminService.updateAdmin(id, adminData);
    return res.status(200).json(ApiResponse.success('Administrador actualizado', admin));
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de administrador inválido', 400);

    await AdminService.removeAdmin(id);
    return res.status(200).json(ApiResponse.success('Administrador eliminado'));
  });
}

export { sanitizeAdminInput };
