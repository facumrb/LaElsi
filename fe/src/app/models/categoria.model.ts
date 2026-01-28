import { IApiItem } from './item.model';

export interface IApiCategoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  items?: IApiItem[];
}
