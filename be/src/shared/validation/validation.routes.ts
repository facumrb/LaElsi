import { Router } from 'express';
import { ValidationController } from './validation.controller.js';
import { validationLimiter } from '../middlewares/rateLimiter.js';

const validationRouter = Router();

validationRouter.get('/', validationLimiter, ValidationController.validateUnique);

export { validationRouter };
