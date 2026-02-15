import { Entity, Property, ManyToOne, Rel } from '@mikro-orm/core';
import { User } from '../../user/user.entity.js';
import { CustomBaseEntity } from '../db/customBaseEntity.entity.js';

@Entity()
export class AuditLog extends CustomBaseEntity {
    @ManyToOne(() => User, { nullable: false })
    user!: Rel<User>;

    @Property({ nullable: false })
    action!: string;

    @Property({ nullable: false })
    targetType!: string;

    @Property({ nullable: true })
    targetId?: number;

    @Property({ type: 'json', nullable: true })
    details?: any;
}
