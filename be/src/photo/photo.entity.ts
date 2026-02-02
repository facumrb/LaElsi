import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Product } from '../product/product.entity.js';

@Entity()
export class Photo {
  @PrimaryKey()
  id!: number;

  // Guardamos el nombre del archivo generado (ej: "1234-5678.jpg")
  // Esto es lo que usaremos para construir la URL pública
  @Property()
  fileName!: string;
  //Es el nombre "real" en el disco (ej: "a4b5-cc21.jpg").
  //Es util para saber que archivo cargar cuando hay que mostrar la foto.

  @Property()
  originalName!: string;
  // Es el nombre que tenía originalmente (ej: "vacaciones.jpg").
  // Sirve por si alguna vez se permite que el usuario descargue la foto con su nombre original.

  @Property()
  mimeType!: string;
  // Sirve para ver si es 'image/png' o 'image/jpeg'.

  @Property({ default: 0 })
  order!: number;
  // Sirve para asignar el orden de las fotos en el carrousel

  @ManyToOne(() => Product, { deleteRule: 'cascade' })
  product!: Product;
  // Si se borra el Product, se borran sus fotos de la BD
}
