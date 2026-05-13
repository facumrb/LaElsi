import { Request, Response } from 'express';
import { BulkProductService, BulkPriceAdjustmentDto } from './bulkProduct.service.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';

export class BulkProductController {
  /** Vista previa de los cambios de precio sin aplicarlos. */
  static preview = asyncHandler(async (req: Request, res: Response) => {
    const dto: BulkPriceAdjustmentDto = req.body;
    const results = await BulkProductService.preview(dto);
    return res.status(200).json(ApiResponse.success('Vista previa generada', results));
  });

  /** Aplica los cambios masivos de precio. */
  static apply = asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Usuario no autenticado', 401);

    const dto: BulkPriceAdjustmentDto = req.body;
    const result = await BulkProductService.apply(dto, adminId);
    return res.status(200).json(ApiResponse.success('Cambios masivos aplicados', result));
  });

  /** Revierte un lote de cambios masivos. */
  static rollback = asyncHandler(async (req: Request, res: Response) => {
    const batchId = Number.parseInt(req.params.batchId);
    if (isNaN(batchId)) throw new AppError('ID de lote inválido', 400);

    const adminId = req.user?.id;
    if (!adminId) throw new AppError('Usuario no autenticado', 401);

    await BulkProductService.rollback(batchId, adminId);
    return res.status(200).json(ApiResponse.success('Lote revertido correctamente'));
  });

  /** Obtiene el historial de cambios masivos. */
  static getHistory = asyncHandler(async (_req: Request, res: Response) => {
    const batches = await BulkProductService.getHistory();
    return res.status(200).json(ApiResponse.success('Historial de cambios masivos', batches));
  });
}
