import { Request, Response } from 'express';
import { ProductPhotoService } from './productPhoto.service.js';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';

export class ProductPhotoController {
  static uploadProductPhotos = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const { orders } = req.body;
    const id = Number(req.params.id);

    if (isNaN(id)) throw new AppError('ID de Producto inválido', 400);

    const result = await ProductPhotoService.uploadProductPhotos(id, files, orders);
    return res.status(201).json(ApiResponse.created('Fotos subidas correctamente', result));
  });

  static reorderProductPhotos = asyncHandler(async (req: Request, res: Response) => {
    const { photosOrder } = req.body;
    await ProductPhotoService.reorderProductPhotos(photosOrder);
    return res.status(200).json(ApiResponse.success('Orden actualizado'));
  });

  static deleteProductPhoto = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.photoId);
    if (isNaN(id)) throw new AppError('ID de foto inválido', 400);

    await ProductPhotoService.deleteProductPhoto(id);
    return res.status(200).json(ApiResponse.success('Foto eliminada correctamente'));
  });
}
