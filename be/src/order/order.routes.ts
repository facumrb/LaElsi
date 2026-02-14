import { Router } from 'express';
import { OrderController } from './order.controller.js';

const router = Router();

// 1. Crear Orden (POST /api/orders)
router.post('/', OrderController.create);

// 2. Obtener todas las órdenes (GET /api/orders)
router.get('/', OrderController.findAll);

// 3. Obtener una orden por ID (GET /api/orders/:id)
router.get('/:id', OrderController.findOne);

// 4. Obtener órdenes por Cliente (GET /api/orders/client/:clientId)
router.get('/client/:clientId', OrderController.findByClient);

// 5. Actualizar Estado (PATCH /api/orders/:id/status)
router.patch('/:id/status', OrderController.updateStatus);

// 6. Eliminar/Cancelar Orden (DELETE /api/orders/:id)
router.delete('/:id', OrderController.remove);

export const orderRouter = router;
