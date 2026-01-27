import { IApiItem } from './item.model';

export type EstadoEntidad = 'Activo' | 'Inactivo';

export interface IApiCategoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: EstadoEntidad;
  items?: IApiItem[];
}
