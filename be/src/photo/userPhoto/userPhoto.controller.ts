import { Request, Response } from 'express';
import { UserPhotoService } from './userPhoto.service.js';
import { asyncHandler } from '../../shared/errors/asyncHandler.js';
import { AppError } from '../../shared/errors/appError.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';

export class UserPhotoController {
  static uploadUserPhoto = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const id = Number(req.params.id);

    if (isNaN(id)) throw new AppError('ID de Usuario inválido', 400);

    const result = await UserPhotoService.uploadUserPhoto(id, file, req.user);
    return res.status(201).json(ApiResponse.created('Foto de perfil actualizada correctamente', result));
  });

  static deleteUserPhoto = asyncHandler(async (req: Request, res: Response) => {
    const photoId = Number(req.params.photoId);
    if (isNaN(photoId)) throw new AppError('ID de foto inválido', 400);

    await UserPhotoService.deleteUserPhoto(photoId, req.user);
    return res.status(200).json(ApiResponse.success('Foto de perfil eliminada'));
  });
}
