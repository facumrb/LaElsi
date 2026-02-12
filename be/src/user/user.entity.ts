import { Property, Entity, PrimaryKey, Enum, OneToOne, Rel } from '@mikro-orm/core';
import bcrypt from 'bcrypt';
import type { UserPhoto } from '../photo/userPhoto/userPhoto.entity.js';

export enum UserRole {
  ADMIN = 'Admin',
  CLIENT = 'Client'
}

// Usamos STI (Single Table Inheritance) porque UserPhoto necesita apuntar a una tabla "User".
// Admin y Client se guardarán en la misma tabla 'user' diferenciados por una columna 'dtype'.
@Entity({ discriminatorColumn: 'dtype' })
export abstract class User {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: false, length: 100 })
  name!: string;

  @Property({ nullable: false, length: 100 })
  last_name!: string;

  @Property({ nullable: false, unique: true, length: 15 })
  dni!: string;

  @Property({ nullable: false, length: 20 })
  phone!: string;

  @Property({ nullable: false, unique: true, length: 30 })
  username!: string;

  @Property({ nullable: false, hidden: true, length: 100 })
  password!: string;

  @Property({ nullable: false, unique: true })
  email!: string;

  @Enum(() => UserRole)
  role!: UserRole;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;

  @OneToOne('UserPhoto', 'user', { nullable: true })
  photo?: Rel<UserPhoto>;

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
