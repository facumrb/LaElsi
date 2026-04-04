import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';

function sanitizeCategoryInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    order: req.body.order,
    state: req.body.state,
    parentId: req.body.parentId,
    products: req.body.products
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

export class CategoryController {
  static searchCategoriesByText = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;
    const categories = await CategoryService.searchCategoriesByText(query as string);
    return res.status(200).json(ApiResponse.success('Categorías encontradas', categories));
  });

  static add = asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.addCategory(req.body.sanitizedInput);
    return res.status(201).json(ApiResponse.created('Categoría creada', category));
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const categories = await CategoryService.findAll();
    return res.status(200).json(ApiResponse.success('Todas las Categorías fueron encontradas', categories));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    const category = await CategoryService.findOne(id);
    return res.status(200).json(ApiResponse.success('Categoría encontrada', category));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    const category = await CategoryService.updateCategory(id, req.body.sanitizedInput);
    return res.status(200).json(ApiResponse.success('Categoría actualizada', category));
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    await CategoryService.removeCategory(id);
    return res.status(200).json(ApiResponse.success('Categoría eliminada'));
  });

  static getTree = asyncHandler(async (req: Request, res: Response) => {
    const depthLimit = req.query.depth ? Number.parseInt(req.query.depth as string) : 5;
    const state = req.query.state as string;
    const categories = await CategoryService.getTree(depthLimit, state);
    return res.status(200).json(ApiResponse.success('Árbol de categorías obtenido', categories));
  });

  static getChildren = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    const children = await CategoryService.getChildren(id);
    return res.status(200).json(ApiResponse.success('Subcategorías encontradas', children));
  });

  static findAllActive = asyncHandler(async (req: Request, res: Response) => {
    const categories = await CategoryService.findAllActive();
    return res.status(200).json(ApiResponse.success('Categorías activas encontradas', categories));
  });

  static bulkUpdateOrder = asyncHandler(async (req: Request, res: Response) => {
    const updates = req.body.updates;
    await CategoryService.bulkUpdateOrderAndParent(updates);
    return res.status(200).json(ApiResponse.success('Orden de categorías actualizado'));
  });
}

export { sanitizeCategoryInput };
