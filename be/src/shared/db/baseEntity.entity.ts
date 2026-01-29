import { PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity {
  @PrimaryKey()
  id!: number;

  /*
  @Property({ type: 'date' })
  registration_date? = new Date()

  @Property({
    type: 'date',
    onUpdate: () => new Date(),
  })
  update_date? = new Date()
  */
}
