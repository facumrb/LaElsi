import { Entity, OneToMany, Property, Cascade, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Item } from '../producto/item.entity.js';

@Entity()
export class Categoria extends BaseEntity {
  @Property({ nullable: false, unique: true }) // debe ser unique
  nombre!: string;

  @Property({ type: 'text', nullable: true })
  descripcion!: string;

  @Property({ nullable: false })
  estado!: string; // Activo o Inactivo

  @OneToMany(() => Item, (item) => item.categoria)
  items = new Collection<Item>(this);
}
