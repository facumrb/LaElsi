import { Request, Response } from 'express';
import { OrderService, CreateOrderDto, UpdateOrderStatusDto } from './order.service.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';
import { getPaginationParams } from '../shared/utils/pagination.js';

export class OrderController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const orderData: CreateOrderDto = req.body;
    const order = await OrderService.createOrder(orderData);
    return res.status(201).json(ApiResponse.created('Orden creada exitosamente', order));
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPaginationParams(req);
    const { query, status, deliveryMethod, paymentMethod } = req.query;

    const orders = await OrderService.findAll(page, limit, {
      query: query as string,
      status: status as string,
      deliveryMethod: deliveryMethod as string,
      paymentMethod: paymentMethod as string
    });
    return res.status(200).json(ApiResponse.success('Todas las órdenes encontradas', orders));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

    const order = await OrderService.findOne(id);
    return res.status(200).json(ApiResponse.success('Orden encontrada', order));
  });

  static findByClient = asyncHandler(async (req: Request, res: Response) => {
    const clientId = Number(req.params.clientId);
    if (isNaN(clientId)) throw new AppError('ID de cliente inválido', 400);

    const { page, limit } = getPaginationParams(req);
    const orders = await OrderService.findByClient(clientId, page, limit);
    return res.status(200).json(ApiResponse.success('Órdenes del cliente encontradas', orders));
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

    const { status } = req.body as UpdateOrderStatusDto;
    const order = await OrderService.updateStatus(id, status);
    return res.status(200).json(ApiResponse.success('Estado de la orden actualizado', order));
  });

  static updateDeliveryMethod = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

    const { deliveryMethod } = req.body;
    const order = await OrderService.updateDeliveryMethod(id, deliveryMethod);
    return res.status(200).json(ApiResponse.success('Método de entrega actualizado', order));
  });

  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

    const order = await OrderService.cancelOrder(id);
    return res.status(200).json(ApiResponse.success('Orden cancelada correctamente', order));
  });
}
