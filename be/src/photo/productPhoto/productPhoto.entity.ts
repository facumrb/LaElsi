import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Photo } from '../photo.entity.js';
import { Product } from '../../product/product.entity.js';

@Entity({ discriminatorValue: 'product_photo' })
export class ProductPhoto extends Photo {
  @Property({ default: 0, nullable: false })
  order!: number;
  // Sirve para asignar el orden de las fotos en el carrousel

  @ManyToOne(() => Product, { deleteRule: 'cascade', nullable: false })
  product!: Product;
  // Si se borra el Product, se borran sus fotos de la BD
}
