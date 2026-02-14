import { Entity, Property, ManyToOne, OneToMany, Collection, Enum, Cascade, Rel } from '@mikro-orm/core';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';
import { Client } from '../user/client/client.entity.js';
import { OrderLine } from './order-line.entity.js';
import { OrderState } from '../shared/enums/state.enum.js';
import { Product } from '../product/product.entity.js';

@Entity()
export class Order extends CustomBaseEntity {
    @ManyToOne(() => Client, { nullable: false })
    client!: Rel<Client>;

    @OneToMany(() => OrderLine, line => line.order, { cascade: [Cascade.ALL], orphanRemoval: true })
    items = new Collection<OrderLine>(this);

    @Enum(() => OrderState)
    status: OrderState = OrderState.PENDING;

    @Property({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number = 0;

    @Property({ nullable: true })
    dateTime: Date = new Date();

    addItem(product: Product, quantity: number, currentPrice: number) {
        // Verificar si el producto ya existe en la orden para sumar cantidad
        const existingLine = this.items.getItems().find(line => line.product.id === product.id);

        if (existingLine) {
            existingLine.quantity += quantity;
            existingLine.price = currentPrice; // Actualizamos precio al actual si cambia? Usualmente se mantiene el acordado o se actualiza todo. Asumiremos precio actual.
        } else {
            const line = new OrderLine(this, product, quantity, currentPrice);
            this.items.add(line);
        }

        this.recalculateTotal();
    }

    removeItem(lineId: number) {
        const line = this.items.getItems().find(line => line.id === lineId);
        if (line) {
            this.items.remove(line);
            this.recalculateTotal();
        }
    }

    updateLineQuantity(lineId: number, newQuantity: number) {
        const line = this.items.getItems().find(line => line.id === lineId);
        if (line) {
            if (newQuantity <= 0) {
                this.items.remove(line);
            } else {
                line.quantity = newQuantity;
            }
            this.recalculateTotal();
        }
    }

    recalculateTotal() {
        this.totalAmount = this.items.getItems().reduce((total, line) => {
            return total + (Number(line.price) * line.quantity);
        }, 0);
    }

    changeStatus(newState: OrderState) {
        if (this.status === OrderState.CANCELLED) {
            throw new Error('No se puede cambiar el estado de una orden cancelada');
        }
        // Aquí se pueden agregar más reglas de negocio, como no volver a PENDING si ya fue SHIPPED, etc.
        this.status = newState;
    }
}
