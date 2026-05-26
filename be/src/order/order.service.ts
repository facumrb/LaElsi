import { orm } from '../shared/db/orm.js';
import { Order } from './order.entity.js';
import { OrderLine } from './order-line.entity.js';
import { Client } from '../user/client/client.entity.js';
import { Product } from '../product/product.entity.js';
import { OrderState } from '../shared/enums/state.enum.js';
import { DeliveryMethod } from '../shared/enums/delivery-method.enum.js';
import { PaymentMethod } from '../shared/enums/payment-method.enum.js';
import { AppError } from '../shared/errors/appError.js';
import { PaginatedResult } from '../shared/utils/pagination.interface.js';
import { DEFAULT_PAGE_SIZE } from '../shared/config/pagination.js';
import { buildPaginatedResponse } from '../shared/utils/pagination.js';
const VALID_ORDER_STATES = Object.values(OrderState);
const VALID_DELIVERY_METHODS = Object.values(DeliveryMethod);
const VALID_PAYMENT_METHODS = Object.values(PaymentMethod);

export interface CreateOrderDto {
  clientId: number;
  deliveryMethod?: DeliveryMethod;
  paymentMethod: PaymentMethod;
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusDto {
  status: OrderState;
}

export class OrderService {
  static async createOrder(data: CreateOrderDto) {
    const em = orm.em;
    const { clientId, items, deliveryMethod, paymentMethod } = data;

    if (clientId === undefined || clientId === null || isNaN(Number(clientId))) {
      throw new AppError('ID de cliente inválido o no proporcionado', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('La orden debe contener al menos un producto', 400);
    }

    for (const item of items) {
      if (!item.productId || isNaN(Number(item.productId))) {
        throw new AppError('Cada item debe tener un productId válido', 400);
      }
      if (item.quantity === undefined || item.quantity === null || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new AppError(`La cantidad del producto (ID: ${item.productId}) debe ser un entero positivo`, 400);
      }
    }

    if (deliveryMethod !== undefined && !VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
      throw new AppError(`Método de entrega inválido. Los métodos válidos son: ${VALID_DELIVERY_METHODS.join(', ')}`, 400);
    }

    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new AppError(`Método de pago inválido o no proporcionado. Los métodos válidos son: ${VALID_PAYMENT_METHODS.join(', ')}`, 400);
    }

    const finalDeliveryMethod = deliveryMethod || DeliveryMethod.RetiroSucursal;
    if (paymentMethod === PaymentMethod.Local && finalDeliveryMethod === DeliveryMethod.Envio) {
      throw new AppError('El pago en el local no está disponible para envíos a domicilio. Por favor, seleccione Transferencia.', 400);
    }

    const client = await em.findOne(Client, { id: Number(clientId) });
    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const order = new Order();
    order.client = client;
    order.deliveryMethod = finalDeliveryMethod;
    order.paymentMethod = paymentMethod;

    for (const item of items) {
      const product = await em.findOne(Product, { id: item.productId }, { populate: ['prices'] });

      if (!product) {
        throw new AppError(`Producto con ID ${item.productId} no encontrado`, 404);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para el producto ${product.name} (ID: ${product.id}). Disponible: ${product.stock}, Solicitado: ${item.quantity}`, 400);
      }

      const currentPriceObj = product.prices.getItems().find((p) => p.isCurrent);
      const currentPrice = currentPriceObj?.amount;

      if (!currentPrice) {
        throw new AppError(`El producto ${product.name} no tiene un precio activo`, 400);
      }

      product.stock -= item.quantity;
      if (product.totalSold === undefined) product.totalSold = 0;
      product.totalSold += item.quantity;

      const line = new OrderLine();
      line.order = order;
      line.product = product;
      line.quantity = item.quantity;
      line.price = currentPrice;

      order.items.add(line);
      order.totalAmount = Number(order.totalAmount) + Number(currentPrice) * item.quantity;
    }

    em.persist(order);
    await em.flush();

    await em.populate(order, ['client', 'items', 'items.product', 'items.product.photos']);
    return order;
  }

  static async findAll(
    page: number = 1,
    limit: number = DEFAULT_PAGE_SIZE,
    filters: { query?: string; status?: string; deliveryMethod?: string; paymentMethod?: string } = {}
  ): Promise<PaginatedResult<Order>> {
    const em = orm.em;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filters.status && VALID_ORDER_STATES.includes(filters.status as OrderState)) {
      where.status = filters.status;
    }

    if (filters.deliveryMethod && VALID_DELIVERY_METHODS.includes(filters.deliveryMethod as DeliveryMethod)) {
      where.deliveryMethod = filters.deliveryMethod;
    }

    if (filters.paymentMethod && VALID_PAYMENT_METHODS.includes(filters.paymentMethod as PaymentMethod)) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.query) {
      const q = filters.query.trim();
      // Si es un número, buscar por ID de orden
      if (/^\d+$/.test(q)) {
        where.id = Number(q);
      } else {
        // Buscar por nombre o apellido del cliente
        where.client = {
          $or: [{ name: { $like: `%${q}%` } }, { lastName: { $like: `%${q}%` } }]
        };
      }
    }

    const [data, total] = await em.findAndCount(Order, where, {
      populate: ['client', 'items', 'items.product', 'items.product.photos'],
      limit,
      offset,
      orderBy: { id: 'DESC' }
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async findOne(id: number) {
    const em = orm.em;
    const order = await em.findOne(
      Order,
      { id },
      {
        populate: ['client', 'items', 'items.product', 'items.product.photos']
      }
    );

    if (!order) {
      throw new AppError('Orden no encontrada', 404);
    }
    return order;
  }

  static async findByClient(clientId: number, page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Order>> {
    const em = orm.em;
    const offset = (page - 1) * limit;
    const [data, total] = await em.findAndCount(
      Order,
      { client: { id: clientId } },
      {
        populate: ['client', 'items', 'items.product', 'items.product.photos'],
        orderBy: { id: 'DESC' },
        limit,
        offset
      }
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  static async updateStatus(id: number, status: string) {
    const em = orm.em;
    if (!status || !VALID_ORDER_STATES.includes(status as OrderState)) {
      throw new AppError(`Estado inválido. Los estados válidos son: ${VALID_ORDER_STATES.join(', ')}`, 400);
    }

    const order = await em.findOne(Order, { id });
    if (!order) {
      throw new AppError('Orden no encontrada', 404);
    }

    OrderService.validateStatusTransition(order, status as OrderState);

    order.status = status as OrderState;

    await em.flush();
    await em.populate(order, ['client', 'items', 'items.product', 'items.product.photos']);
    return order;
  }

  private static validateStatusTransition(order: Order, newState: OrderState) {
    // Seguridad: usar Map en lugar de un objeto plano para que las búsquedas nunca recorran la
    // cadena de prototipos (CWE-1321).
    const TRANSITIONS_ENVIO = new Map<OrderState, OrderState[]>([
      [OrderState.Pending, [OrderState.Paid, OrderState.Cancelled]],
      [OrderState.Paid, [OrderState.Shipped, OrderState.Cancelled]],
      [OrderState.Shipped, [OrderState.Delivered, OrderState.Cancelled]],
      [OrderState.Delivered, []],
      [OrderState.Cancelled, []]
    ]);

    const TRANSITIONS_RETIRO = new Map<OrderState, OrderState[]>([
      [OrderState.Pending, [OrderState.Paid, OrderState.Cancelled]],
      [OrderState.Paid, [OrderState.Delivered, OrderState.Cancelled]],
      [OrderState.Shipped, []],
      [OrderState.Delivered, []],
      [OrderState.Cancelled, []]
    ]);

    const map = order.deliveryMethod === DeliveryMethod.Envio ? TRANSITIONS_ENVIO : TRANSITIONS_RETIRO;
    const allowedTransitions = map.get(order.status) || [];

    if (!allowedTransitions.includes(newState)) {
      const transitionsStr = allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'ninguna (estado final)';
      throw new AppError(`No se puede cambiar el estado de "${order.status}" a "${newState}" para una orden de tipo "${order.deliveryMethod}". Transiciones válidas: ${transitionsStr}`, 400);
    }
  }

  static async updateDeliveryMethod(id: number, deliveryMethod: string) {
    const em = orm.em;
    if (!deliveryMethod || !VALID_DELIVERY_METHODS.includes(deliveryMethod as DeliveryMethod)) {
      throw new AppError(`Método de entrega inválido. Los métodos válidos son: ${VALID_DELIVERY_METHODS.join(', ')}`, 400);
    }

    const order = await em.findOne(Order, { id });
    if (!order) {
      throw new AppError('Orden no encontrada', 404);
    }

    if ([OrderState.Shipped, OrderState.Delivered, OrderState.Cancelled].includes(order.status)) {
      throw new AppError(`No se puede cambiar el método de entrega de una orden en estado "${order.status}"`, 400);
    }

    order.deliveryMethod = deliveryMethod as DeliveryMethod;
    await em.flush();
    await em.populate(order, ['client', 'items', 'items.product', 'items.product.photos']);
    return order;
  }

  static async cancelOrder(id: number) {
    const em = orm.em;
    const order = await em.findOne(Order, { id }, { populate: ['items', 'items.product', 'items.product.photos'] });

    if (!order) {
      throw new AppError('Orden no encontrada', 404);
    }

    if (order.status === OrderState.Cancelled) {
      throw new AppError('La orden ya se encuentra cancelada', 400);
    }

    order.items.getItems().forEach((item) => {
      const product = item.product;
      if (product) {
        product.stock += item.quantity;
        if (product.totalSold !== undefined) {
          product.totalSold -= item.quantity;
        }
      }
    });

    OrderService.validateStatusTransition(order, OrderState.Cancelled);
    order.status = OrderState.Cancelled;

    await em.flush();
    await em.populate(order, ['client', 'items', 'items.product', 'items.product.photos']);
    return order;
  }
}
