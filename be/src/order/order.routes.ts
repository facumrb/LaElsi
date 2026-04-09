import { Router } from 'express';
import { OrderController } from './order.controller.js';

const router = Router();

// 1. Crear Orden (POST /api/orders)
router.post('/', OrderController.create);

// 2. Obtener todas las órdenes (GET /api/orders)
router.get('/', OrderController.findAll);

// 3. Obtener órdenes por Cliente (GET /api/orders/client/:clientId)
router.get('/client/:clientId', OrderController.findByClient);

// 4. Obtener una orden por ID (GET /api/orders/:id)
router.get('/:id', OrderController.findOne);

// 5. Actualizar Estado (PATCH /api/orders/:id/status)
router.patch('/:id/status', OrderController.updateStatus);

// 6. Actualizar Método de Entrega (PATCH /api/orders/:id/delivery-method)
router.patch('/:id/delivery-method', OrderController.updateDeliveryMethod);

// 7. Cancelar Orden (PATCH /api/orders/:id/cancel)
router.patch('/:id/cancel', OrderController.cancel);

export const orderRouter = router;
