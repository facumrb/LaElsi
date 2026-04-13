import { Property, Entity, Enum, OneToOne, Rel } from '@mikro-orm/core';
import type { UserPhoto } from '../photo/userPhoto/userPhoto.entity.js';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';

export enum UserRole {
  Admin = 'Admin',
  Client = 'Client'
}

// Usamos STI (Single Table Inheritance) porque UserPhoto necesita apuntar a una tabla "User".
// Admin y Client se guardarán en la misma tabla 'user' diferenciados por una columna 'dtype'.
@Entity({ discriminatorColumn: 'dtype' })
export abstract class User extends CustomBaseEntity {
  @Property({ nullable: true, length: 100 })
  name?: string;

  @Property({ nullable: true, length: 100 })
  lastName?: string;

  @Property({ nullable: true, unique: true, length: 15 })
  dni?: string;

  @Property({ nullable: true, length: 20 })
  phone?: string;


  @Property({ nullable: false, unique: true, length: 30 })
  username!: string;

  @Property({ nullable: false, hidden: true, length: 100 })
  password!: string;

  @Property({ nullable: false, unique: true })
  email!: string;

  @Enum(() => UserRole)
  role!: UserRole;

  @OneToOne('UserPhoto', 'user', { nullable: true })
  photo?: Rel<UserPhoto>;
}
