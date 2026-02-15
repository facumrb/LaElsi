import { Entity, Property, ManyToOne, Rel, OneToMany, Collection } from '@mikro-orm/core';
import { User } from '../../user/user.entity.js';
import { CustomBaseEntity } from '../../shared/db/customBaseEntity.entity.js';
import { Price } from '../price/price.entity.js';

@Entity()
export class PriceChangeBatch extends CustomBaseEntity {
    @ManyToOne(() => User, { nullable: false })
    user!: Rel<User>;

    @Property({ nullable: false })
    adjustmentType!: 'fixed' | 'percentage';

    @Property({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
    adjustmentValue!: number;

    @Property({ nullable: true })
    roundingRule?: string;

    @Property({ nullable: false, default: false })
    isReverted: boolean = false;

    @OneToMany(() => Price, (price) => price.batch)
    prices = new Collection<Price>(this);
}
