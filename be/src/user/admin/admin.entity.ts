import { Entity, Property } from '@mikro-orm/core';
import { User } from '../user.entity.js';

@Entity()
export class Admin extends User { // Updated extends
    // ...
}