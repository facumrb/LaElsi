import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js';
import { Order } from './order.entity.js';
import { Client } from '../user/client/client.entity.js';
import { Product } from '../product/product.entity.js';
import { OrderState } from '../shared/enums/state.enum.js';

const em = orm.em;

// --- DTOs (Por simplicidad se dejan aquí, podrían ir a un archivo aparte) ---
interface CreateOrderDto {
    clientId: number;
    items: {
        productId: number;
        quantity: number;
    }[];
}

interface UpdateOrderStatusDto {
    status: OrderState;
}

export class OrderController {

    static async create(req: Request, res: Response): Promise<any> {
        try {
            const { clientId, items }: CreateOrderDto = req.body;

            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'La orden debe tener al menos un producto' });
            }

            const client = await em.findOne(Client, { id: clientId });
            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            const order = new Order();
            order.client = client;

            // Validar y agregar productos
            for (const item of items) {
                const product = await em.findOne(Product, { id: item.productId }, { populate: ['prices'] });

                if (!product) {
                    return res.status(404).json({ message: `Producto con ID ${item.productId} no encontrado` });
                }

                // Validar stock (Opcional por ahora, pero recomendado)
                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` });
                }

                // Obtener precio actual
                const currentPriceEntity = product.prices.getItems().find(p => p.isCurrent);
                const currentPrice = currentPriceEntity ? Number(currentPriceEntity.amount) : 0;

                if (!currentPriceEntity) {
                    return res.status(400).json({ message: `El producto ${product.name} no tiene un precio vigente definido` });
                }

                // Usar método de negocio de la entidad
                order.addItem(product, item.quantity, currentPrice);

                // Actualizar stock del producto
                product.stock -= item.quantity;
                product.total_sold += item.quantity;
            }

            await em.persistAndFlush(order);
            return res.status(201).json({ message: 'Orden creada exitosamente', data: order });

        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }

    static async findAll(req: Request, res: Response): Promise<any> {
        try {
            const orders = await em.find(Order, {}, {
                populate: ['client', 'items', 'items.product']
            });
            return res.json({ data: orders });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }

    static async findOne(req: Request, res: Response): Promise<any> {
        try {
            const id = Number(req.params.id);
            const order = await em.findOne(Order, { id }, {
                populate: ['client', 'items', 'items.product']
            });

            if (!order) {
                return res.status(404).json({ message: 'Orden no encontrada' });
            }

            return res.json({ data: order });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }

    static async findByClient(req: Request, res: Response): Promise<any> {
        try {
            const clientId = Number(req.params.clientId);
            const orders = await em.find(Order, { client: { id: clientId } }, {
                populate: ['items', 'items.product'],
                orderBy: { createdAt: 'DESC' }
            });
            return res.json({ data: orders });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }

    static async updateStatus(req: Request, res: Response): Promise<any> {
        try {
            const id = Number(req.params.id);
            const { status }: UpdateOrderStatusDto = req.body;

            const order = await em.findOne(Order, { id });

            if (!order) {
                return res.status(404).json({ message: 'Orden no encontrada' });
            }

            try {
                order.changeStatus(status);
            } catch (e: any) {
                return res.status(400).json({ message: e.message });
            }

            await em.flush();
            return res.json({ message: 'Estado actualizado', data: order });

        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }

    static async remove(req: Request, res: Response): Promise<any> {
        try {
            const id = Number(req.params.id);
            const order = await em.findOne(Order, { id }, { populate: ['items', 'items.product'] });

            if (!order) {
                return res.status(404).json({ message: 'Orden no encontrada' });
            }

            if (order.status !== OrderState.CANCELLED && order.status !== OrderState.DELIVERED) {
                for (const line of order.items) {
                    line.product.stock += line.quantity;
                    line.product.total_sold -= line.quantity;
                }
            }

            order.changeStatus(OrderState.CANCELLED);
            await em.flush();

            return res.json({ message: 'Orden cancelada exitosamente' });

        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
        }
    }
}
