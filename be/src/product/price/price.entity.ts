import { Entity, PrimaryKey, Property, ManyToOne, Rel, Enum } from '@mikro-orm/core';
import { Product } from '../product.entity.js';
import { Currency } from '../../shared/enums/currency.enum.js';
import type { PriceChangeBatch } from '../price-change-batch/priceChangeBatch.entity.js';

@Entity()
export class Price {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: false })
  amount!: number;

  @Enum(() => Currency)
  currency: Currency = Currency.ARS;

  @Property({ defaultRaw: 'now()', nullable: false })
  validFrom: Date = new Date();

  @Property({ default: true })
  isCurrent: boolean = true;

  @ManyToOne(() => Product, { deleteRule: 'cascade', nullable: false })
  product!: Rel<Product>;

  @ManyToOne('PriceChangeBatch', { nullable: true })
  batch?: Rel<PriceChangeBatch>;
}
