import { Entity, OneToOne, type Rel } from '@mikro-orm/core';
import type { User } from '../../user/user.entity.js';
import { Photo } from '../photo.entity.js';

@Entity({ discriminatorValue: 'user_photo' })
export class UserPhoto extends Photo {
  @OneToOne('User', { deleteRule: 'cascade', nullable: false })
  user!: Rel<User>;
  // Si se borra el User, se borra su foto de la BD
}
