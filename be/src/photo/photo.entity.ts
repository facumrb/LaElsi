import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Product } from '../product/product.entity.js';

@Entity()
export class Photo extends BaseEntity {
  // Guardamos el nombre del archivo generado (ej: "1234-5678.jpg")
  // Esto es lo que usaremos para construir la URL pública
  @Property()
  fileName!: string;

  // Opcional: Guardar el nombre original (ej: "mi_perro.jpg")
  @Property()
  originalName!: string;

  // Opcional: Guardar el tipo MIME (ej: "image/jpeg")
  @Property()
  mimeType!: string;

  // Relación: Muchas fotos pertenecen a UN Producto
  // deleteRule: 'CASCADE' significa que si borras el Product, se borran sus fotos de la BD
  @ManyToOne(() => Product, { deleteRule: 'cascade' })
  product!: Product;
}
