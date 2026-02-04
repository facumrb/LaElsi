import { IApiProduct } from './product.model';

export interface IApiCategory {
  id: number;
  name: string;
  description: string;
  state: 'Activo' | 'Inactivo';
  products?: IApiProduct[];
}
