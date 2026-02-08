import { PrimaryKey, Entity, OneToMany, Property, Collection, Enum } from '@mikro-orm/core';
import { Product } from '../product/product.entity.js';
import { CategoryState } from '../shared/enums/state.enum.js';

@Entity()
export class Category {
  @PrimaryKey()
  id!: number;

  @Property({ length: 50, unique: true })
  name!: string;

  @Property({ nullable: true, length: 1000 })
  description!: string;

  @Enum(() => CategoryState)
  state: CategoryState = CategoryState.ACTIVO;

  @OneToMany(() => Product, (product) => product.category)
  products = new Collection<Product>(this);
}

/*
@Property({ type: 'date' })
registration_date? = new Date()

@Property({
  type: 'date',
  onUpdate: () => new Date(),
})
update_date? = new Date()
*/
