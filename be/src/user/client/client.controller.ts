import { Request, Response } from 'express';
import { ClientService, CreateClientDto, UpdateClientDto } from './client.service.js';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';
import { getPaginationParams } from '../../shared/utils/pagination.js';


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
    const { page, limit } = getPaginationParams(req);
    const fiscalCondition = req.query.fiscalCondition as string | undefined;
    const clients = await ClientService.findAll(page, limit, fiscalCondition);
    return res.status(200).json(ApiResponse.success('Todos los Clientes fueron encontrados', clients));
  });

  static searchClientByText = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;
    const { page, limit } = getPaginationParams(req);
    const clients = await ClientService.searchClientByText(query as string, page, limit);
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
