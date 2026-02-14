import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { CustomBaseEntity } from '../shared/db/customBaseEntity.entity.js';

@Entity({
  discriminatorColumn: 'type',
  abstract: true
})
export abstract class Photo {
  @PrimaryKey()
  id!: number;

  // Guardamos el nombre del archivo generado (ej: "1234-5678.jpg")
  // Esto es lo que usaremos para construir la URL pública
  @Property({ nullable: false, unique: true })
  fileName!: string;
  //Es el nombre "real" en el disco (ej: "a4b5-cc21.jpg").
  //Es util para saber que archivo cargar cuando hay que mostrar la foto.

  @Property({ nullable: false })
  originalName!: string;
  // Es el nombre que tenía originalmente (ej: "vacaciones.jpg").
  // Sirve por si alguna vez se permite que el usuario descargue la foto con su nombre original.

  @Property({ nullable: false })
  mimeType!: string;
  // Sirve para ver si es 'image/png' o 'image/jpeg'.
}
