import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Property, Entity } from '@mikro-orm/core';

@Entity({ abstract: true })
export abstract class UserBaseEntity extends BaseEntity {
  @Property({ type: 'string', nullable: false })
  name!: string;

  @Property({ type: 'string', nullable: false })
  last_name!: string;

  @Property({ type: 'string', nullable: false }) // Capaz si permite nulos
  phone!: string;

  @Property({ type: 'string', nullable: false, unique: true })
  user!: string;

  @Property({ hidden: true, type: 'string', nullable: false })
  password!: string;

  @Property({ type: 'string', nullable: false, unique: true }) // Capaz si permite nulos
  email!: string;
}
// @Property({ type: 'string', nullable: true })
// foto?: string;

// @Property({ type: 'string', nullable: true })
// direccion?: string;

// @Property({ type: 'Date' })
// fechaDeAlta!: Date;
