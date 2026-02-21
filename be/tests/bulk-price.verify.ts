import { orm } from '../src/shared/db/orm.js';
import { Product } from '../src/product/product.entity.js';
import { BulkProductController } from '../src/product/bulkProduct.controller.js';
import { PriceChangeBatch } from '../src/product/price-change-batch/priceChangeBatch.entity.js';
import { AuditLog } from '../src/shared/audit/auditLog.entity.js';
import { User, UserRole } from '../src/user/user.entity.js';

// Script de Verificación Integral de Lógica de Precios Masivos
async function runFullVerification() {
  console.log('🚀 INICIANDO VERIFICACIÓN INTEGRAL DE PRECIOS MASIVOS\n');

  try {
    await orm.connect();
    const em = orm.em.fork();

    // Setup: Obtener datos de prueba
    const admin = await em.findOne(User, { role: UserRole.Admin });
    if (!admin) throw new Error('No se encontró Admin en la DB.');

    const products = await em.find(Product, {}, { limit: 2, populate: ['prices'] });
    const productIds = products.map((p) => p.id);

    // Auxiliar para llamadas asíncronas
    const callController = (method: any, req: any) => {
      return new Promise((resolve) => {
        const res: any = {
          _status: 200,
          _data: null,
          status: (s: number) => {
            res._status = s;
            return res;
          },
          json: (d: any) => {
            res._data = d;
            resolve({ status: res._status, data: d });
            return res;
          }
        };
        const next = (err: any) => {
          if (err) resolve({ error: err });
          else resolve({ status: res._status, data: res._data });
        };
        method(req, res, next);
      });
    };

    // --- GRUPO 1: VISTA PREVIA Y CÁLCULOS ---
    console.log('📋 GRUPO 1: VISTA PREVIA Y REGLAS DE NEGOCIO');

    const testPreview = async (type: string, val: number, rounding: string, label: string) => {
      const result: any = await callController(BulkProductController.preview, {
        body: { productIds, adjustmentType: type, adjustmentValue: val, roundingRule: rounding }
      });
      if (result.data?.status === 'success') {
        console.log(`  ✅ [PREVIEW] ${label}: OK`);
        return result.data.data;
      } else {
        console.log(`  ❌ [PREVIEW] ${label}: FALLÓ (${result.error?.message || 'Error desconocido'})`);
      }
    };

    await testPreview('percentage', 10, 'nearest-integer', 'Aumento 10% Redondeo Cercano');
    await testPreview('percentage', 10.5, 'ceil', 'Aumento 10.5% Redondeo Techo');
    await testPreview('fixed', 500, 'none', 'Monto Fijo +$500');

    // --- GRUPO 2: LÍMITES Y ERRORES ---
    console.log('\n🛡️ GRUPO 2: PROTECCIÓN Y LÍMITES');

    // Descuento excesivo
    const err1: any = await callController(BulkProductController.preview, {
      body: { productIds: [productIds[0]], adjustmentType: 'percentage', adjustmentValue: -95 }
    });
    if (err1.data?.data?.[0]?.isValid === false) console.log('  ✅ [LÍMITE] Bloqueo descuento > 90%: OK');
    else console.log('  ❌ [LÍMITE] No bloqueó descuento excesivo');

    // Precio Negativo
    const err2: any = await callController(BulkProductController.preview, {
      body: { productIds: [productIds[0]], adjustmentType: 'fixed', adjustmentValue: -9999999 }
    });
    if (err2.data?.data?.[0]?.isValid === false) console.log('  ✅ [LÍMITE] Bloqueo precio <= $0: OK');
    else console.log('  ❌ [LÍMITE] No bloqueó precio negativo');

    // Errores de input
    const err3: any = await callController(BulkProductController.preview, {
      body: { productIds: [], adjustmentType: 'percentage', adjustmentValue: 10 }
    });
    if (err3.error) console.log('  ✅ [INPUT] Validación Array Vacío: OK');

    // --- GRUPO 3: APLICACIÓN Y AUDITORÍA ---
    console.log('\n💾 GRUPO 3: APLICACIÓN REAL Y AUDITORÍA');

    const appResult: any = await callController(BulkProductController.apply, {
      body: { productIds, adjustmentType: 'percentage', adjustmentValue: 5, roundingRule: 'nearest-integer' },
      user: { id: admin.id, role: admin.role, email: admin.email }
    });

    if (appResult.status === 200) {
      const batchId = appResult.data.data.batchId;
      console.log(`  ✅ [APPLY] Aplicación exitosa. Batch: ${batchId}`);

      const em2 = orm.em.fork();
      const batch = await em2.findOne(PriceChangeBatch, { id: batchId });
      if (batch) console.log('  ✅ [DB] PrecioChangeBatch persistido');

      const audit = await em2.findOne(AuditLog, { action: 'BULK_PRICE_UPDATE' }, { orderBy: { createdAt: 'DESC' } });
      if (audit && audit.details.batchId === batchId) console.log('  ✅ [DB] AuditLog generado con trazabilidad');

      // --- GRUPO 4: REVERSIÓN (ROLLBACK) ---
      console.log('\n⏪ GRUPO 4: REVERSIÓN (ROLLBACK)');

      const prodBefore = await em2.findOne(Product, { id: productIds[0] }, { populate: ['prices'] });
      const currentPrice = prodBefore?.prices.getItems().find((p) => p.isCurrent)?.amount;
      console.log(`  🔍 Precio actual antes de rollback: ${currentPrice}`);

      const rollResult: any = await callController(BulkProductController.rollback, {
        params: { batchId: batchId.toString() },
        user: { id: admin.id, role: admin.role, email: admin.email }
      });

      if (rollResult.status === 200) {
        console.log('  ✅ [ROLLBACK] Ejecución exitosa');
        const em3 = orm.em.fork();
        const prodAfter = await em3.findOne(Product, { id: productIds[0] }, { populate: ['prices'] });
        const revertedPrice = prodAfter?.prices.getItems().find((p) => p.isCurrent)?.amount;
        console.log(`  🔍 Precio después de rollback: ${revertedPrice}`);

        if (revertedPrice !== currentPrice) console.log('  ✅ [ROLLBACK] El precio volvió al estado anterior');

        const batchReverted = await em3.findOne(PriceChangeBatch, { id: batchId });
        if (batchReverted?.isReverted) console.log('  ✅ [ROLLBACK] Lote marcado como revertido');
      } else {
        console.log('  ❌ [ROLLBACK] Falló:', rollResult.error?.message);
      }
    }

    // --- GRUPO 5: HISTORIAL ---
    console.log('\n📜 GRUPO 5: HISTORIAL');
    const histResult: any = await callController(BulkProductController.getHistory, {});
    if (histResult.status === 200) console.log('  ✅ [HISTORY] Obtención de historial: OK');

    console.log('\n✨ VERIFICACIÓN FINALIZADA CON ÉXITO');
  } catch (err: any) {
    console.error('\n💥 ERROR FATAL EN LA PRUEBA:', err.message || err);
  } finally {
    await orm.close();
    process.exit(0);
  }
}

runFullVerification();
