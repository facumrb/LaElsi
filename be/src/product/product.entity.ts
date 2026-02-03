import { PrimaryKey, Entity, Property, ManyToOne, Rel, OneToMany, Collection, Enum, Cascade } from '@mikro-orm/core';
import { Category } from '../category/category.entity.js';
import { ProductPhoto } from '../photo/productPhoto/productPhoto.entity.js';
import { ProductState } from '../shared/state.enum.js';
import { Price } from './price/price.entity.js';
import { Currency } from '../shared/currency.enum.js';

@Entity()
export class Product {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: false, unique: true })
  name!: string;

  @Property({ type: 'text', nullable: false })
  description!: string;

  @Property({ nullable: false })
  brand!: string; // Marca

  @Property({ nullable: false })
  total_sold!: number;

  @Enum(() => ProductState)
  state: ProductState = ProductState.ACTIVO;

  @Property({ nullable: false })
  stock!: number;

  @OneToMany(() => Price, (price) => price.product, { cascade: [Cascade.ALL], nullable: false })
  prices = new Collection<Price>(this);

  @OneToMany({ entity: 'ProductPhoto', nullable: true, mappedBy: 'product' })
  photos = new Collection<ProductPhoto>(this);

  @ManyToOne(() => Category, { nullable: false, updateRule: 'cascade' })
  category!: Rel<Category>;

  updatePrice(amount: number, currency: Currency = Currency.ARS) {
    // Marcamos los precios actuales como no vigentes
    this.prices.getItems().forEach((p) => {
      if (p.isCurrent) p.isCurrent = false;
    });

    // Creamos el nuevo precio
    const newPrice = new Price();
    newPrice.amount = amount;
    newPrice.currency = currency;
    newPrice.product = this;
    newPrice.isCurrent = true;
    newPrice.validFrom = new Date();

    this.prices.add(newPrice);
  }
}

// @Property({ nullable: false })
// registration_date?: Date;

// @Property({ nullable: false })
// update_date?: Date;

// @Property({ nullable: false })
// to_reserve!: boolean;

// @Property({ nullable: false })
// quantity_to_reserve!: number;
