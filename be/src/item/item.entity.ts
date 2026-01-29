import { PrimaryKey, Entity, Property, ManyToOne, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Category } from '../category/category.entity.js';

@Entity()
export class Item extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: false, unique: true })
  name!: string;

  @Property({ type: 'text', nullable: false })
  description!: string;

  @Property({ nullable: false })
  price!: number;

  @Property({ nullable: false })
  brand!: string;

  @Property({ nullable: false })
  number_sold!: number;

  @Property({ nullable: false })
  state!: string; // Activo o Inactivo

  @Property({ nullable: false })
  stock!: number;

  @Property({ nullable: true })
  photos?: string[]; // Array de rutas de imágenes

  @ManyToOne(() => Category, { nullable: false })
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