import { IApiCategoria } from './categoria.model';

export type EstadoEntidad = 'Activo' | 'Inactivo';

export interface IApiItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  marca: string;
  cant_vendidos: number;
  estado: EstadoEntidad;
  stock: number;
  fotos?: string[]; // Array de URLs de las fotos del item
  categoria: IApiCategoria;
}
