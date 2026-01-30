import { IApiProduct } from './product.model';

export interface IApiCategory {
  name: string;
  description: string;
  state: 'Activo' | 'Inactivo';
  products?: IApiProduct[];
}
