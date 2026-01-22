import { Entity, Property } from '@mikro-orm/core';
import { UsuarioBaseEntity } from '../usuario.entity.js';

@Entity()
export class Administrador extends UsuarioBaseEntity {

}
