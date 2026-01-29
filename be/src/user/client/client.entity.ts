import { Entity, Property } from '@mikro-orm/core';
import { UserBaseEntity } from '../user.entity.js';

@Entity()
export class Client extends UserBaseEntity {

}
