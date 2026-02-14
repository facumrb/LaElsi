import { Entity, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';
import { Product } from '../product/product.entity.js';
import { Order } from './order.entity.js';

@Entity()
export class OrderLine extends CustomBaseEntity {
    @ManyToOne(() => Order, { nullable: false, deleteRule: 'cascade' })
    order!: Rel<Order>;

    @ManyToOne(() => Product, { nullable: false })
    product!: Rel<Product>;

    @Property({ nullable: false })
    quantity!: number;

    @Property({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
    price!: number; // Precio histórico al momento de la compra

    // Fix circular dependency: use 'any' or 'Rel<Order>' for the constructor parameter type to avoid
    // "Cannot access 'Order' before initialization" runtime error due to emitDecoratorMetadata.
    constructor(order: any, product: Product, quantity: number, price: number) {
        super();
        this.order = order;
        this.product = product;
        this.quantity = quantity;
        this.price = price;
    }
}
