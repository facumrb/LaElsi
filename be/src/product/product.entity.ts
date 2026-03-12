import { Entity, Property, ManyToOne, Rel, OneToMany, Collection, Enum, Cascade } from '@mikro-orm/core';
import { Category } from '../category/category.entity.js';
import { ProductPhoto } from '../photo/productPhoto/productPhoto.entity.js';
import { ProductState } from '../shared/enums/state.enum.js';
import { Price } from './price/price.entity.js';
import { Currency } from '../shared/enums/currency.enum.js';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';
import type { PriceChangeBatch } from './price-change-batch/priceChangeBatch.entity.js';

@Entity()
export class Product extends CustomBaseEntity {
  @Property({ nullable: false, unique: true, length: 50 })
  name!: string;

  @Property({ nullable: false, type: 'text', length: 1000 })
  description!: string;

  @Property({ nullable: false })
  brand!: string;

  @Property({ nullable: false })
  totalSold: number = 0;

  @Enum(() => ProductState)
  state: ProductState = ProductState.Activo;

  @Property({ nullable: false })
  stock!: number;

  @OneToMany(() => Price, (price) => price.product, { cascade: [Cascade.ALL], nullable: false })
  prices = new Collection<Price>(this);

  @OneToMany({ entity: 'ProductPhoto', nullable: true, mappedBy: 'product' })
  photos = new Collection<ProductPhoto>(this);

  @ManyToOne(() => Category, { nullable: false, updateRule: 'cascade' })
  category!: Rel<Category>;
}

// @Property({ nullable: false })
// to_reserve!: boolean;

// @Property({ nullable: false })
// quantity_to_reserve!: number;
