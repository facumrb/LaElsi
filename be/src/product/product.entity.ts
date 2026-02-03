import { PrimaryKey, Entity, Property, ManyToOne, Rel, OneToMany, Collection } from '@mikro-orm/core';
import { Category } from '../category/category.entity.js';
import { Photo } from '../photo/photo.entity.js';
import { ProductPhoto } from '../photo/productPhoto/productPhoto.entity.js';

@Entity()
export class Product {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: false, unique: true })
  name!: string;

  @Property({ type: 'text', nullable: false })
  description!: string;

  @Property({ nullable: false })
  price!: number;

  @Property({ nullable: false })
  brand!: string; // Marca

  @Property({ nullable: false })
  total_sold!: number;

  @Property({ nullable: false })
  state!: 'Activo' | 'Inactivo';

  @Property({ nullable: false })
  stock!: number;

  @OneToMany({ entity: 'ProductPhoto', nullable: true, mappedBy: 'product' })
  photos = new Collection<ProductPhoto>(this);

  @ManyToOne(() => Category, { nullable: false, updateRule: 'cascade' })
  category!: Rel<Category>;
}

// @Property({ nullable: false })
// registration_date?: Date;

// @Property({ nullable: false })
// update_date?: Date;

// @Property({ nullable: false })
// to_reserve!: boolean;

// @Property({ nullable: false })
// quantity_to_reserve!: number;
