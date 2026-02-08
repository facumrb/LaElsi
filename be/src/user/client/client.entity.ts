import { Entity, Property, Enum } from '@mikro-orm/core';
import { User } from '../user.entity.js';
import { FiscalCondition } from '../../shared/enums/fiscal-condition.enum.js';

@Entity()
export class Client extends User {
  @Property({ nullable: true, unique: true, length: 11 })
  cuit?: string;

  @Enum({ items: () => FiscalCondition, default: FiscalCondition.CONSUMIDOR_FINAL })
  fiscalCondition: FiscalCondition = FiscalCondition.CONSUMIDOR_FINAL;

  @Property({ nullable: true })
  street?: string;

  @Property({ nullable: true })
  streetNumber?: number;

  @Property({ nullable: true })
  city?: string;

  @Property({ nullable: true })
  province?: string;

  @Property({ nullable: true })
  postalCode?: string;

  @Property({ nullable: true })
  floor?: string;

  @Property({ nullable: true })
  apartment?: string;
}
