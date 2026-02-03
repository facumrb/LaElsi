import { Entity, Property } from '@mikro-orm/core';
import { User } from '../user.entity.js';

@Entity()
export class Client extends User {
    @Property({ nullable: true })
    street?: string;

    @Property({ nullable: true })
    streetNumber?: number;

    @Property({ nullable: true })
    city?: string;

    @Property({ nullable: true })
    province?: string;

    @Property({ nullable: true })
    postalCode?: string;

    @Property({ nullable: true })
    floor?: string;

    @Property({ nullable: true })
    apartment?: string;
}
