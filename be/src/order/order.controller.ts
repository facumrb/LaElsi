import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { Order } from './order.entity.js';
import { Client } from '../user/client/client.entity.js';
import { Product } from '../product/product.entity.js';
import { OrderState } from '../shared/enums/state.enum.js';
import { DeliveryMethod } from '../shared/enums/delivery-method.enum.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { AppError } from '../shared/errors/appError.js';

// --- DTOs ---
interface CreateOrderDto {
    clientId: number;
    deliveryMethod?: DeliveryMethod;
    items: {
        productId: number;
        quantity: number;
    }[];
}

interface UpdateOrderStatusDto {
    status: OrderState;
}

const VALID_ORDER_STATES = Object.values(OrderState);
const VALID_DELIVERY_METHODS = Object.values(DeliveryMethod);

export class OrderController {

    static create = asyncHandler(async (req: Request, res: Response) => {
        const em = orm.em;
        const { clientId, items, deliveryMethod } = req.body;

        // Validar clientId
        if (clientId === undefined || clientId === null || isNaN(Number(clientId))) {
            throw new AppError('ID de cliente inválido o no proporcionado', 400);
        }

        // Validar items como array no vacío
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new AppError('La orden debe contener al menos un producto', 400);
        }

        // Validar cada item del array
        for (const item of items) {
            if (!item.productId || isNaN(Number(item.productId))) {
                throw new AppError('Cada item debe tener un productId válido', 400);
            }
            if (item.quantity === undefined || item.quantity === null || !Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new AppError(`La cantidad del producto (ID: ${item.productId}) debe ser un entero positivo`, 400);
            }
        }

        // Validar deliveryMethod si se proporciona
        if (deliveryMethod !== undefined && !VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
            throw new AppError(`Método de entrega inválido. Los métodos válidos son: ${VALID_DELIVERY_METHODS.join(', ')}`, 400);
        }

        // Validar cliente
        const client = await em.findOne(Client, { id: Number(clientId) });
        if (!client) {
            throw new AppError('Cliente no encontrado', 404);
        }

        const order = new Order();
        order.client = client;
        order.deliveryMethod = deliveryMethod || DeliveryMethod.RETIRO_SUCURSAL;

        // items is array of { productId, quantity }
        for (const item of items) {
            const product = await em.findOne(Product, { id: item.productId }, { populate: ['prices'] });

            if (!product) {
                throw new AppError(`Producto con ID ${item.productId} no encontrado`, 404);
            }

            // Validar stock
            if (product.stock < item.quantity) {
                throw new AppError(`Stock insuficiente para el producto ${product.name} (ID: ${product.id}). Disponible: ${product.stock}, Solicitado: ${item.quantity}`, 400);
            }

            // Obtener precio actual
            const currentPriceObj = product.prices.getItems().find((p) => p.isCurrent);
            const currentPrice = currentPriceObj?.amount;

            if (!currentPrice) {
                throw new AppError(`El producto ${product.name} no tiene un precio activo`, 400);
            }

            // Descontar stock y actualizar contador de ventas
            product.stock -= item.quantity;
            if (product.total_sold === undefined) product.total_sold = 0;
            product.total_sold += item.quantity;

            // Agregar item a la orden
            order.addItem(product, item.quantity, currentPrice);
        }

        await em.persistAndFlush(order);

        return res.status(201).json({
            message: 'Orden creada exitosamente',
            data: order
        });
    });

    static findAll = asyncHandler(async (req: Request, res: Response) => {
        const em = orm.em;
        const orders = await em.find(Order, {}, {
            populate: ['client', 'items', 'items.product']
        });

        return res.status(200).json({
            message: 'Todas las órdenes encontradas',
            data: orders
        });
    });

    static findOne = asyncHandler(async (req: Request, res: Response) => {
        const em = orm.em;
        const id = Number(req.params.id);
        if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

        const order = await em.findOne(Order, { id }, {
            populate: ['client', 'items', 'items.product']
        });

        if (!order) {
            throw new AppError('Orden no encontrada', 404);
        }

        return res.status(200).json({
            message: 'Orden encontrada',
            data: order
        });
    });

    static findByClient = asyncHandler(async (req: Request, res: Response) => {
        const em = orm.em;
        const clientId = Number(req.params.clientId);
        if (isNaN(clientId)) throw new AppError('ID de cliente inválido', 400);

        const orders = await em.find(Order, { client: { id: clientId } }, {
            populate: ['items', 'items.product'],
            orderBy: { createdAt: 'DESC' }
        });

        return res.status(200).json({
            message: 'Órdenes del cliente encontradas',
            data: orders
        });
    });

    static updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const em = orm.em;
        const id = Number(req.params.id);
        if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

        const { status } = req.body;

        // Validar que el status sea un valor válido del enum
        if (!status || !VALID_ORDER_STATES.includes(status)) {
            throw new AppError(`Estado inválido. Los estados válidos son: ${VALID_ORDER_STATES.join(', ')}`, 400);
        }

        const order = await em.findOne(Order, { id });
        if (!order) {
            throw new AppError('Orden no encontrada', 404);
        }

        try {
            order.changeStatus(status as OrderState);
        } catch (e: any) {
            throw new AppError(e.message, 400);
        }

        await em.flush();

        return res.status(200).json({
            message: 'Estado de la orden actualizado',
            data: order
        });
    });

    static updateDeliveryMethod = asyncHandler(async (req: Request, res: Response) => {
        const em = orm.em;
        const id = Number(req.params.id);
        if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

        const { deliveryMethod } = req.body;

        if (!deliveryMethod || !VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
            throw new AppError(`Método de entrega inválido. Los métodos válidos son: ${VALID_DELIVERY_METHODS.join(', ')}`, 400);
        }

        const order = await em.findOne(Order, { id });
        if (!order) {
            throw new AppError('Orden no encontrada', 404);
        }

        // No permitir cambiar el método si la orden ya fue enviada o entregada
        if ([OrderState.SHIPPED, OrderState.DELIVERED, OrderState.CANCELLED].includes(order.status)) {
            throw new AppError(`No se puede cambiar el método de entrega de una orden en estado "${order.status}"`, 400);
        }

        order.deliveryMethod = deliveryMethod;
        await em.flush();

        return res.status(200).json({
            message: 'Método de entrega actualizado',
            data: order
        });
    });

    static cancel = asyncHandler(async (req: Request, res: Response) => {
        const em = orm.em;
        const id = Number(req.params.id);
        if (isNaN(id)) throw new AppError('ID de orden inválido', 400);

        const order = await em.findOne(Order, { id }, { populate: ['items', 'items.product'] });

        if (!order) {
            throw new AppError('Orden no encontrada', 404);
        }

        if (order.status === OrderState.CANCELLED) {
            throw new AppError('La orden ya se encuentra cancelada', 400);
        }

        // Restaurar stock antes de cancelar
        order.items.getItems().forEach(item => {
            const product = item.product;
            if (product) {
                product.stock += item.quantity;
                if (product.total_sold !== undefined) {
                    product.total_sold -= item.quantity;
                }
            }
        });

        try {
            order.changeStatus(OrderState.CANCELLED);
        } catch (e: any) {
            throw new AppError(e.message, 400);
        }

        await em.flush();

        return res.status(200).json({
            message: 'Orden cancelada correctamente',
            data: order
        });
    });
}
