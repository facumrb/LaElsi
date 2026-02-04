import { Property, Entity, PrimaryKey, Enum } from '@mikro-orm/core';
import bcrypt from 'bcrypt';

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

  @Property({ nullable: false })
  name!: string;

  @Property({ nullable: false })
  last_name!: string;

  @Property({ nullable: false, unique: true, length: 8 })
  dni!: string;

  @Property({ nullable: false })
  phone!: string;

  @Property({ nullable: false, unique: true })
  username!: string;

  @Property({ hidden: true, type: 'string', nullable: false })
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

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
