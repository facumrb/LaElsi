import { Request, Response } from 'express';
import { ProductService, CreateProductDto, UpdateProductDto } from './product.service.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';
import { getPaginationParams } from '../shared/utils/pagination.js';

function sanitizeProductInput(req: Request, res: Response, next: any) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    brand: req.body.brand,
    totalSold: req.body.totalSold,
    state: req.body.state,
    stock: req.body.stock,
    price: req.body.price,
    currency: req.body.currency,
    category: req.body.category
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

export class ProductController {
  // ============================================================================
  // CREACIÓN DE PRODUCTOS
  // ============================================================================
  static add = asyncHandler(async (req: Request, res: Response) => {
    const productData: CreateProductDto = req.body.sanitizedInput;
    const product = await ProductService.addProduct(productData);
    return res.status(201).json(ApiResponse.created('Producto creado', product));
  });

  // ============================================================================
  // BÚSQUEDAS Y CATEGORÍAS
  // ============================================================================
  static searchProductsByText = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;
    const { page, limit } = getPaginationParams(req);

    const products = await ProductService.searchProductsByText(query as string, page, limit);
    return res.status(200).json(ApiResponse.success('Productos encontrados', products));
  });

  static findProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const categoryId = Number.parseInt(req.params.categoryId);
    const { page, limit } = getPaginationParams(req);

    if (isNaN(categoryId)) throw new AppError('ID de categoría inválido', 400);

    const products = await ProductService.findProductsByCategory(categoryId, page, limit);
    return res.status(200).json(ApiResponse.success('Productos encontrados en la categoría', products));
  });

  static findActiveProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const categoryId = Number.parseInt(req.params.categoryId);
    const { page, limit } = getPaginationParams(req);

    if (isNaN(categoryId)) throw new AppError('ID de categoría inválido', 400);

    const products = await ProductService.findActiveProductsByCategory(categoryId, page, limit);
    return res.status(200).json(ApiResponse.success('Productos activos encontrados en la categoría', products));
  });

  // ============================================================================
  // CONSULTAS GENERALES
  // ============================================================================
  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPaginationParams(req);
    const { query, state, categoryId, stockFilter } = req.query;

    const products = await ProductService.findAll(page, limit, {
      query: query as string,
      state: state as any,
      categoryId: categoryId ? Number(categoryId) : undefined,
      stockFilter: stockFilter as string
    });
    return res.status(200).json(ApiResponse.success('Todos los Productos fueron encontrados', products));
  });

  static findOne = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de producto inválido', 400);

    const product = await ProductService.findOne(id);
    return res.status(200).json(ApiResponse.success('Producto encontrado', product));
  });

  static findOneActive = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de producto inválido', 400);

    const product = await ProductService.findOneActive(id);
    return res.status(200).json(ApiResponse.success('Producto encontrado', product));
  });

  // ============================================================================
  // ACTUALIZACIÓN
  // ============================================================================
  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de producto inválido', 400);

    const productData: UpdateProductDto = req.body.sanitizedInput;
    const product = await ProductService.updateProduct(id, productData);
    return res.status(200).json(ApiResponse.success('Producto actualizado', product));
  });

  // ============================================================================
  // BORRADO
  // ============================================================================
  static remove = asyncHandler(async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) throw new AppError('ID de producto inválido', 400);

    await ProductService.removeProduct(id);
    return res.status(200).json(ApiResponse.success('Producto eliminado'));
  });

  // ============================================================================
  // 📄 DATOS PAGINADOS Y ESTADOS ACTIVOS (CLIENTE FINAL)
  // ============================================================================
  static findPage = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPaginationParams(req);

    const data = await ProductService.findPage(page, limit);
    return res.status(200).json(ApiResponse.success('Página de productos encontrada', data));
  });

  static findAllActive = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPaginationParams(req);
    const products = await ProductService.findAllActive(page, limit);
    return res.status(200).json(ApiResponse.success('Productos activos encontrados', products));
  });

  // ============================================================================
  // ⭐ PRODUCTOS DESTACADOS (BEST SELLERS)
  // ============================================================================
  static findBestSellers = asyncHandler(async (req: Request, res: Response) => {
    const limit = Number.parseInt(req.query.limit as string) || 10;
    const products = await ProductService.findBestSellers(limit);
    return res.status(200).json(ApiResponse.success('Productos más vendidos encontrados', products));
  });

  static findBestSellersByCategory = asyncHandler(async (req: Request, res: Response) => {
    const categoryId = Number.parseInt(req.params.categoryId);
    const limit = Number.parseInt(req.query.limit as string) || 10;

    if (isNaN(categoryId)) throw new AppError('ID de categoría inválido', 400);

    const products = await ProductService.findBestSellersByCategory(categoryId, limit);
    return res.status(200).json(ApiResponse.success('Productos más vendidos de la categoría encontrados', products));
  });
}

export { sanitizeProductInput };
