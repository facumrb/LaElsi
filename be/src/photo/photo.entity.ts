import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({
  discriminatorColumn: 'type',
  abstract: true
})
export abstract class Photo {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: false, unique: true })
  fileName!: string;
  //Es el nombre "real" en el disco (ej: "a4b5-cc21.webp").
  //Es util para saber que archivo cargar cuando hay que mostrar la foto.
}
