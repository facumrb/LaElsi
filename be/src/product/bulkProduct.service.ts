import { orm } from '../shared/db/orm.js';
import { Product } from './product.entity.js';
import { Price } from './price/price.entity.js';
import { Currency } from '../shared/enums/currency.enum.js';
import { PriceChangeBatch } from './price-change-batch/priceChangeBatch.entity.js';
import { AuditLog } from '../shared/audit/auditLog.entity.js';
import { AppError } from '../shared/errors/appError.js';
import { User } from '../user/user.entity.js';

// ─── Constantes ──────────────────────────────────────────────────────────────
const DEFAULT_MAX_DISCOUNT = 90;

function getMaxDiscountLimit(): number {
  const envLimit = process.env.MAX_BULK_DISCOUNT_PERCENTAGE;
  return envLimit ? parseInt(envLimit, 10) : DEFAULT_MAX_DISCOUNT;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────
export interface BulkPriceAdjustmentDto {
  productIds: number[];
  adjustmentType: 'fixed' | 'percentage';
  adjustmentValue: number;
  roundingRule?: 'nearest-integer' | 'ceil';
}

export interface BulkPreviewItem {
  productId: number;
  name: string;
  currentPrice: number;
  newPrice: number;
  diff: number;
  isValid: boolean;
  error: string | null;
}

export interface BulkApplyResult {
  batchId: number;
  updatedCount: number;
  errorCount: number;
  errors: { productId: number; name: string; error: string }[];
}

// ─── Service ─────────────────────────────────────────────────────────────────
export class BulkProductService {
  /**
   * Calcula el nuevo precio para un producto dado el ajuste y la regla de redondeo.
   * No persiste nada.
   */
  private static computeNewPrice(
    currentPrice: number,
    adjustmentType: 'fixed' | 'percentage',
    adjustmentValue: number,
    roundingRule?: string
  ): number {
    let newPrice =
      adjustmentType === 'fixed'
        ? currentPrice + adjustmentValue
        : currentPrice + (currentPrice * adjustmentValue) / 100;

    if (roundingRule === 'nearest-integer') newPrice = Math.round(newPrice);
    else if (roundingRule === 'ceil') newPrice = Math.ceil(newPrice);

    return newPrice;
  }

  /**
   * Valida el dto de ajuste masivo. Lanza AppError si algo es inválido.
   */
  static validateAdjustmentDto(dto: BulkPriceAdjustmentDto): void {
    if (!Array.isArray(dto.productIds) || dto.productIds.length === 0) {
      throw new AppError('Debe proporcionar al menos un ID de producto', 400);
    }
    if (!['fixed', 'percentage'].includes(dto.adjustmentType)) {
      throw new AppError('Tipo de ajuste inválido. Use "fixed" o "percentage"', 400);
    }
    if (typeof dto.adjustmentValue !== 'number') {
      throw new AppError('El valor de ajuste debe ser un número', 400);
    }
  }

  /**
   * Valida si un nuevo precio es seguro según las reglas de negocio.
   * Devuelve el mensaje de error o null si es válido.
   */
  private static validateNewPrice(
    adjustmentType: string,
    adjustmentValue: number,
    newPrice: number
  ): string | null {
    const maxDiscount = getMaxDiscountLimit();
    if (newPrice <= 0) return 'El precio final no puede ser cero o negativo';
    if (adjustmentType === 'percentage' && adjustmentValue < -maxDiscount) {
      return `Descuento excesivo (máximo permitido: ${maxDiscount}%)`;
    }
    return null;
  }

  /**
   * Genera una vista previa de los cambios de precio sin persistir nada.
   */
  static async preview(dto: BulkPriceAdjustmentDto): Promise<BulkPreviewItem[]> {
    this.validateAdjustmentDto(dto);
    const em = orm.em;
    const products = await em.find(Product, { id: { $in: dto.productIds } }, { populate: ['prices'] });

    return products.map((product) => {
      const currentPrice = product.prices.getItems().find((p) => p.isCurrent)?.amount ?? 0;
      const newPrice = this.computeNewPrice(currentPrice, dto.adjustmentType, dto.adjustmentValue, dto.roundingRule);
      const error = this.validateNewPrice(dto.adjustmentType, dto.adjustmentValue, newPrice);

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
  }

  /**
   * Aplica los cambios masivos de precio y registra el batch + auditoría.
   */
  static async apply(dto: BulkPriceAdjustmentDto, adminId: number): Promise<BulkApplyResult> {
    this.validateAdjustmentDto(dto);
    const em = orm.em.fork();

    const admin = await em.findOne(User, { id: adminId });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    const products = await em.find(Product, { id: { $in: dto.productIds } }, { populate: ['prices'] });
    if (products.length === 0) throw new AppError('No se encontraron productos para actualizar', 404);

    // Crear el lote de cambios
    const batch = new PriceChangeBatch();
    batch.user = admin;
    batch.adjustmentType = dto.adjustmentType;
    batch.adjustmentValue = dto.adjustmentValue;
    batch.roundingRule = dto.roundingRule;
    em.persist(batch);

    let updatedCount = 0;
    let errorCount = 0;
    const errors: BulkApplyResult['errors'] = [];

    for (const product of products) {
      const currentPriceEntity = product.prices.getItems().find((p) => p.isCurrent);
      const currentPrice = currentPriceEntity?.amount ?? 0;
      const newPrice = this.computeNewPrice(currentPrice, dto.adjustmentType, dto.adjustmentValue, dto.roundingRule);

      const priceError = this.validateNewPrice(dto.adjustmentType, dto.adjustmentValue, newPrice);
      if (priceError) {
        errorCount++;
        errors.push({ productId: product.id, name: product.name, error: priceError });
        continue;
      }

      // Desactivar precio actual y crear el nuevo
      product.prices.getItems().forEach((p) => { if (p.isCurrent) p.isCurrent = false; });

      const newPriceEntity = em.create(Price, {
        amount: newPrice,
        currency: currentPriceEntity?.currency ?? Currency.ARS,
        product,
        isCurrent: true,
        validFrom: new Date(),
        batch
      });
      product.prices.add(newPriceEntity);
      updatedCount++;
    }

    // Registrar auditoría
    const audit = new AuditLog();
    audit.user = admin;
    audit.action = 'BULK_PRICE_UPDATE';
    audit.targetType = 'Product';
    audit.details = {
      batchId: batch.id,
      adjustmentType: dto.adjustmentType,
      adjustmentValue: dto.adjustmentValue,
      productIds: dto.productIds,
      updatedCount,
      errorCount
    };
    em.persist(audit);

    await em.flush();

    return { batchId: batch.id, updatedCount, errorCount, errors };
  }

  /**
   * Revierte un lote de cambios masivos, restaurando el precio anterior de cada producto.
   */
  static async rollback(batchId: number, adminId: number): Promise<void> {
    const em = orm.em.fork();

    const batch = await em.findOne(PriceChangeBatch, { id: batchId }, { populate: ['prices'] });
    if (!batch) throw new AppError('Lote no encontrado', 404);
    if (batch.isReverted) throw new AppError('Este lote ya ha sido revertido', 400);

    const admin = await em.findOne(User, { id: adminId });
    if (!admin) throw new AppError('Administrador no encontrado', 404);

    for (const price of batch.prices) {
      const product = await em.findOne(Product, { id: price.product.id }, { populate: ['prices'] });
      if (!product) continue;

      price.isCurrent = false;

      const previousPrice = product.prices
        .getItems()
        .filter((p) => p.id !== price.id && p.validFrom < price.validFrom)
        .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];

      if (previousPrice) previousPrice.isCurrent = true;
    }

    batch.isReverted = true;

    // Auditoría
    const audit = new AuditLog();
    audit.user = admin;
    audit.action = 'BULK_PRICE_ROLLBACK';
    audit.targetType = 'PriceChangeBatch';
    audit.targetId = batchId;
    em.persist(audit);

    await em.flush();
  }

  /**
   * Devuelve el historial de lotes de cambios masivos.
   */
  static async getHistory(): Promise<PriceChangeBatch[]> {
    const em = orm.em.fork();
    return em.find(PriceChangeBatch, {}, { populate: ['user'], orderBy: { createdAt: 'DESC' } });
  }
}
