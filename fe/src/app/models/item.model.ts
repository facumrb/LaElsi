import { IApiCategoria } from './categoria.model';

export type EstadoEntidad = 'Activo' | 'Inactivo';

export interface IApiItem {
  id: number;
  nombre: string;
  fotos?: string[]; // Array de URLs de las fotos del item
  descripcion: string;
  precio: number;
  marca: string;
  cant_vendidos: number;
  estado: EstadoEntidad;
  stock: number;
  categoria?: IApiCategoria | null;
}
