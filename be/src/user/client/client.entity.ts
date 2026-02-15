import { Entity, Property, Enum, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { User } from '../user.entity.js';
import { FiscalCondition } from '../../shared/enums/fiscal-condition.enum.js';
import { Order } from '../../order/order.entity.js';

@Entity()
export class Client extends User {
  @OneToMany(() => Order, (order) => order.client, { cascade: [Cascade.ALL] })
  orders = new Collection<Order>(this);

  @Property({ nullable: true, unique: true, length: 11 })
  cuit?: string;

  @Enum({ items: () => FiscalCondition, default: FiscalCondition.ConsumidorFinal })
  fiscalCondition: FiscalCondition = FiscalCondition.ConsumidorFinal;

  @Property({ nullable: true, length: 100 })
  street?: string;

  @Property({ nullable: true, length: 10 })
  streetNumber?: number;

  @Property({ nullable: true, length: 100 })
  city?: string;

  @Property({ nullable: true, length: 100 })
  province?: string;

  @Property({ nullable: true, length: 10 })
  postalCode?: string;

  @Property({ nullable: true, length: 5 })
  floor?: string;

  @Property({ nullable: true, length: 5 })
  apartment?: string;
}
