import { Entity, OneToMany, Property, Collection, Enum, ManyToOne } from '@mikro-orm/core';
import { Product } from '../product/product.entity.js';
import { CategoryState } from '../shared/enums/state.enum.js';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';

@Entity()
export class Category extends CustomBaseEntity {
  @Property({ nullable: false, unique: true, length: 50 })
  name!: string;

  @Property({ nullable: true, length: 1000 })
  description!: string;

  @Property({ index: true, default: 0 })
  order: number = 0;

  @Enum(() => CategoryState)
  state: CategoryState = CategoryState.Activo;

  @ManyToOne(() => Category, { nullable: true, index: true })
  parent?: Category;

  @OneToMany(() => Category, (cat) => cat.parent)
  children = new Collection<Category>(this);

  @Property({ default: 0 })
  depth: number = 0;

  @OneToMany(() => Product, (product) => product.category)
  products = new Collection<Product>(this);
}