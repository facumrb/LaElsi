import { Entity, Property } from '@mikro-orm/core';
import { UserBaseEntity } from '../user.entity.js'; // Renamed from UsuarioBaseEntity

@Entity()
export class Admin extends UserBaseEntity { // Updated extends
    // ...
}