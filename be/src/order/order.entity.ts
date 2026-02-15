import { Entity, Property, ManyToOne, OneToMany, Collection, Enum, Cascade, Rel } from '@mikro-orm/core';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';
import { Client } from '../user/client/client.entity.js';
import { OrderLine } from './order-line.entity.js';
import { OrderState } from '../shared/enums/state.enum.js';
import { DeliveryMethod } from '../shared/enums/delivery-method.enum.js';
import { Product } from '../product/product.entity.js';

@Entity()
export class Order extends CustomBaseEntity {
  @ManyToOne(() => Client, { nullable: false })
  client!: Rel<Client>;

  @OneToMany(() => OrderLine, (line) => line.order, { cascade: [Cascade.ALL], orphanRemoval: true })
  items = new Collection<OrderLine>(this);

  @Enum(() => OrderState)
  status: OrderState = OrderState.Pending;

  @Enum(() => DeliveryMethod)
  deliveryMethod: DeliveryMethod = DeliveryMethod.RetiroSucursal;

  @Property({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number = 0;

  @Property({ nullable: true })
  dateTime: Date = new Date();

  addItem(product: Product, quantity: number, currentPrice: number) {
    // Verificar si el producto ya existe en la orden para sumar cantidad
    const existingLine = this.items.getItems().find((line) => line.product.id === product.id);

    if (existingLine) {
      existingLine.quantity += quantity;
      existingLine.price = currentPrice;
    } else {
      const line = new OrderLine(this, product, quantity, currentPrice);
      this.items.add(line);
    }

    this.recalculateTotal();
  }

  removeItem(lineId: number) {
    const line = this.items.getItems().find((line) => line.id === lineId);
    if (line) {
      this.items.remove(line);
      this.recalculateTotal();
    }
  }

  updateLineQuantity(lineId: number, newQuantity: number) {
    const line = this.items.getItems().find((line) => line.id === lineId);
    if (line) {
      if (newQuantity <= 0) {
        this.items.remove(line);
      } else {
        line.quantity = newQuantity;
      }
      this.recalculateTotal();
    }
  }

  recalculateTotal() {
    this.totalAmount = this.items.getItems().reduce((total, line) => {
      return total + Number(line.price) * line.quantity;
    }, 0);
  }

  // Transiciones según método de entrega
  private static readonly TRANSITIONS_ENVIO: Record<OrderState, OrderState[]> = {
    [OrderState.Pending]: [OrderState.Paid, OrderState.Cancelled],
    [OrderState.Paid]: [OrderState.Shipped, OrderState.Cancelled],
    [OrderState.Shipped]: [OrderState.Delivered, OrderState.Cancelled],
    [OrderState.Delivered]: [],
    [OrderState.Cancelled]: []
  };

  private static readonly TRANSITIONS_RETIRO: Record<OrderState, OrderState[]> = {
    [OrderState.Pending]: [OrderState.Paid, OrderState.Cancelled],
    [OrderState.Paid]: [OrderState.Delivered, OrderState.Cancelled],
    [OrderState.Shipped]: [], // No debería llegar aquí en retiro
    [OrderState.Delivered]: [],
    [OrderState.Cancelled]: []
  };

  getValidTransitions(): OrderState[] {
    const map = this.deliveryMethod === DeliveryMethod.Envio ? Order.TRANSITIONS_ENVIO : Order.TRANSITIONS_RETIRO;
    return map[this.status] || [];
  }

  changeStatus(newState: OrderState) {
    const allowedTransitions = this.getValidTransitions();

    if (!allowedTransitions.includes(newState)) {
      const transitionsStr = allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'ninguna (estado final)';
      throw new Error(`No se puede cambiar el estado de "${this.status}" a "${newState}" ` + `para una orden de tipo "${this.deliveryMethod}". ` + `Transiciones válidas: ${transitionsStr}`);
    }

    this.status = newState;
  }
}
