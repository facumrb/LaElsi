import { Entity, OneToMany, Property, Cascade, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Item } from '../producto/item.entity.js';

@Entity()
export class Categoria extends BaseEntity {
  @Property({ nullable: false, unique: true, length: 50 }) // debe ser unique
  nombre!: string;

  @Property({ nullable: true, length: 1000 })
  descripcion!: string;

  @Property({ nullable: false })
  estado!: 'Activo' | 'Inactivo';

  @OneToMany(() => Item, (item) => item.categoria)
  items = new Collection<Item>(this);
}
