import { PrimaryKey, Entity, OneToMany, Property, Collection } from '@mikro-orm/core';
import { Item } from '../item/item.entity.js';

/*
@Property({ type: 'date' })
registration_date? = new Date()

@Property({
  type: 'date',
  onUpdate: () => new Date(),
})
update_date? = new Date()
*/

@Entity()
export class Category {
  @PrimaryKey({ length: 50 })
  name!: string;

  @Property({ nullable: true, length: 1000 })
  description!: string;

  @Property({ nullable: false })
  state!: 'Activo' | 'Inactivo';

  @OneToMany(() => Item, (item) => item.category)
  items = new Collection<Item>(this);
}
