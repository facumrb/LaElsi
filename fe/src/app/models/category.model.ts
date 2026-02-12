import { IApiProduct } from './product.model';

export interface IApiCategory {
  id: number;
  name: string;
  description?: string | null;
  state: 'Activo' | 'Inactivo';
  products?: IApiProduct[];
}

// Para CREAR
export type ICreateCategory = Omit<IApiCategory, 'id' | 'products'>;

// Para EDITAR
export type IUpdateCategory = Partial<ICreateCategory>;
