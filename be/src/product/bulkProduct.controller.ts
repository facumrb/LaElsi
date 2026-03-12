import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { Product } from './product.entity.js';
import { Price } from './price/price.entity.js';
import { Currency } from '../shared/enums/currency.enum.js';
import { PriceChangeBatch } from './price-change-batch/priceChangeBatch.entity.js';
import { AuditLog } from '../shared/audit/auditLog.entity.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';
import { User } from '../user/user.entity.js';

const DEFAULT_MAX_DISCOUNT = 90;
const getMaxDiscountLimit = () => {
  const envLimit = process.env.MAX_BULK_DISCOUNT_PERCENTAGE;
  return envLimit ? parseInt(envLimit, 10) : DEFAULT_MAX_DISCOUNT;
};

export class BulkProductController {
  // Vista previa de los cambios de precio sin aplicarlos.
  static preview = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em;
    const { productIds, adjustmentType, adjustmentValue, roundingRule } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new AppError('Debe proporcionar al menos un ID de producto', 400);
    }

    if (!['fixed', 'percentage'].includes(adjustmentType)) {
      throw new AppError('Tipo de ajuste inválido. Use "fixed" o "percentage"', 400);
    }

    if (typeof adjustmentValue !== 'number') {
      throw new AppError('El valor de ajuste debe ser un número', 400);
    }

    const products = await em.find(Product, { id: { $in: productIds } }, { populate: ['prices'] });

    const results = products.map((product) => {
      const currentPrice = product.prices.getItems().find((p) => p.isCurrent)?.amount || 0;
      let newPrice = currentPrice;

      if (adjustmentType === 'fixed') {
        newPrice += adjustmentValue;
      } else {
        newPrice += (currentPrice * adjustmentValue) / 100;
      }

      // Reglas de redondeo
      if (roundingRule === 'nearest-integer') {
        newPrice = Math.round(newPrice);
      } else if (roundingRule === 'ceil') {
        newPrice = Math.ceil(newPrice);
      }

      // Validaciones de seguridad
      let error = null;
      const maxDiscount = getMaxDiscountLimit();

      if (newPrice <= 0) {
        error = 'El precio final no puede ser cero o negativo';
      } else if (adjustmentType === 'percentage' && adjustmentValue < -maxDiscount) {
        error = `Descuento excesivo (máximo permitido: ${maxDiscount}%)`;
      }

      return {
        productId: product.id,
        name: product.name,
        currentPrice,
        newPrice,
        diff: newPrice - currentPrice,
        isValid: !error,
        error
      };
    });

    return res.status(200).json(ApiResponse.success('Vista previa generada', results));
  });

  // Aplicar cambios masivos de precio.
  static apply = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const { productIds, adjustmentType, adjustmentValue, roundingRule } = req.body;
    const adminId = req.user?.id;

    if (!adminId) throw new AppError('Usuario no autenticado', 401);

    const admin = await em.findOne(User, { id: adminId });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    const products = await em.find(Product, { id: { $in: productIds } }, { populate: ['prices'] });

    if (products.length === 0) {
      throw new AppError('No se encontraron productos para actualizar', 404);
    }

    // Crear el lote (batch) de cambios
    const batch = new PriceChangeBatch();
    batch.user = admin;
    batch.adjustmentType = adjustmentType;
    batch.adjustmentValue = adjustmentValue;
    batch.roundingRule = roundingRule;
    em.persist(batch);

    let updatedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const product of products) {
      const currentPriceEntity = product.prices.getItems().find((p) => p.isCurrent);
      const currentPrice = currentPriceEntity?.amount || 0;
      let newPrice = currentPrice;

      if (adjustmentType === 'fixed') {
        newPrice += adjustmentValue;
      } else {
        newPrice += (currentPrice * adjustmentValue) / 100;
      }

      if (roundingRule === 'nearest-integer') {
        newPrice = Math.round(newPrice);
      } else if (roundingRule === 'ceil') {
        newPrice = Math.ceil(newPrice);
      }

      // Validación final
      const maxDiscount = getMaxDiscountLimit();

      if (newPrice <= 0) {
        errorCount++;
        errors.push({ productId: product.id, name: product.name, error: 'Precio final inválido (<= 0)' });
        continue;
      }

      // No permitir descuentos excesivos
      if (adjustmentType === 'percentage' && adjustmentValue < -maxDiscount) {
        errorCount++;
        errors.push({ productId: product.id, name: product.name, error: `Descuento excesivo (máximo permitido: ${maxDiscount}%)` });
        continue;
      }

      product.prices.getItems().forEach((p) => {
        if (p.isCurrent) p.isCurrent = false;
      });

      const newPriceEntity = em.create(Price, {
        amount: newPrice,
        currency: currentPriceEntity?.currency || Currency.ARS,
        product: product,
        isCurrent: true,
        validFrom: new Date(),
        batch: batch
      });
      product.prices.add(newPriceEntity);
      updatedCount++;
    }

    // Registrar en auditoría
    const audit = new AuditLog();
    audit.user = admin;
    audit.action = 'BULK_PRICE_UPDATE';
    audit.targetType = 'Product';
    audit.details = {
      batchId: batch.id,
      adjustmentType,
      adjustmentValue,
      productIds,
      updatedCount,
      errorCount
    };
    em.persist(audit);

    await em.flush();

    return res.status(200).json(
      ApiResponse.success('Cambios masivos aplicados', {
        batchId: batch.id,
        updatedCount,
        errorCount,
        errors
      })
    );
  });

  // Revertir un lote de cambios masivos.
  static rollback = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const batchId = Number.parseInt(req.params.batchId);
    if (isNaN(batchId)) throw new AppError('ID de lote inválido', 400);

    const batch = await em.findOne(PriceChangeBatch, { id: batchId }, { populate: ['prices'] });
    if (!batch) throw new AppError('Lote no encontrado', 404);
    if (batch.isReverted) throw new AppError('Este lote ya ha sido revertido', 400);

    const adminId = req.user?.id;
    const admin = await em.findOne(User, { id: adminId });

    // Para cada precio en este lote, debemos volver al anterior
    for (const price of batch.prices) {
      const product = await em.findOne(Product, { id: price.product.id }, { populate: ['prices'] });
      if (!product) continue;

      // Desactivar el precio del lote
      price.isCurrent = false;

      // Buscar el precio que era vigente JUSTO ANTES de que se aplique este lote
      // Ordenamos por validFrom desc y tomamos el primero que no sea el actual
      const previousPrice = product.prices
        .getItems()
        .filter((p) => p.id !== price.id && p.validFrom < price.validFrom)
        .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];

      if (previousPrice) {
        previousPrice.isCurrent = true;
      }
    }

    batch.isReverted = true;

    // Auditoría
    const audit = new AuditLog();
    audit.user = admin!;
    audit.action = 'BULK_PRICE_ROLLBACK';
    audit.targetType = 'PriceChangeBatch';
    audit.targetId = batch.id;
    em.persist(audit);

    await em.flush();

    return res.status(200).json(ApiResponse.success('Lote revertido correctamente'));
  });

  // Obtener historial de cambios masivos.
  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const em = orm.em.fork();
    const batches = await em.find(
      PriceChangeBatch,
      {},
      {
        populate: ['user'],
        orderBy: { createdAt: 'DESC' }
      }
    );
    return res.status(200).json(ApiResponse.success('Historial de cambios masivos', batches));
  });
}
