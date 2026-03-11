import { Request, Response } from 'express';
import { asyncHandler } from '../errors/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ValidationService } from './validation.service.js';

export class ValidationController {
  static validateUnique = asyncHandler(async (req: Request, res: Response) => {
    const { entity, field, value, excludeId } = req.query;

    const result = await ValidationService.validateUnique(
      entity as string,
      field as string,
      value as string,
      excludeId as string | undefined
    );

    return res.status(200).json(
      ApiResponse.success('Verificación completada', result)
    );
  });
}
