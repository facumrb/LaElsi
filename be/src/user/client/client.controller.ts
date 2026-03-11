import { Request, Response, NextFunction } from 'express';
import { ClientService, CreateClientDto, UpdateClientDto } from './client.service.js';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';

function sanitizeClientInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    lastName: req.body.lastName,
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
    if (
      req.body.sanitizedInput[key] === undefined ||
      (key === 'cuit' && req.body.sanitizedInput[key] === '')
    ) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

export class ClientController {
  static getAccountInfo = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

    const client = await ClientService.getAccountInfo(id);
    return res.status(200).json(ApiResponse.success('Cuenta encontrada', client));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

    const client = await ClientService.findOne(id);
    return res.status(200).json(ApiResponse.success('Cliente encontrado', client));
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const clients = await ClientService.findAll();
    return res.status(200).json(ApiResponse.success('Todos los Clientes fueron encontrados', clients));
  });

  static searchClientByText = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;
    const clients = await ClientService.searchClientByText(query as string);
    return res.status(200).json(ApiResponse.success('Resultados de búsqueda', clients));
  });

  static add = asyncHandler(async (req: Request, res: Response) => {
    const clientData: CreateClientDto = req.body.sanitizedInput;
    const result = await ClientService.addClient(clientData);
    return res.status(201).json(ApiResponse.created('Usuario registrado exitosamente', result));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

    const clientData: UpdateClientDto = req.body.sanitizedInput;
    const client = await ClientService.updateClient(id, clientData);
    return res.status(200).json(ApiResponse.success('Datos actualizados correctamente', client));
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de cliente inválido', 400);

    await ClientService.removeClient(id);
    return res.status(200).json(ApiResponse.success('Cliente eliminado correctamente'));
  });
}

export { sanitizeClientInput };
