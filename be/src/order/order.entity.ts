import { Entity, Property, ManyToOne, OneToMany, Collection, Enum, Cascade, Rel } from '@mikro-orm/core';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';
import { Client } from '../user/client/client.entity.js';
import { OrderLine } from './order-line.entity.js';
import { OrderState } from '../shared/enums/state.enum.js';
import { DeliveryMethod } from '../shared/enums/delivery-method.enum.js';
import { PaymentMethod } from '../shared/enums/payment-method.enum.js';
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
  
  @Enum(() => PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.Transferencia;

  @Property({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number = 0;

  @Property({ nullable: true })
  dateTime: Date = new Date();
}
