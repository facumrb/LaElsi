import { PrimaryKey, Entity, OneToMany, Property, Collection } from '@mikro-orm/core';
import { Product } from '../product/product.entity.js';

@Entity()
export class Category {
  @PrimaryKey({ length: 50 })
  name!: string;

  @Property({ nullable: true, length: 1000 })
  description!: string;

  @Property({ nullable: false })
  state!: 'Activo' | 'Inactivo';

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
