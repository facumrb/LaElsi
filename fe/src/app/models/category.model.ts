import { IApiProduct } from './product.model';

export enum CategoryState {
  Activo = 'Activo',
  Inactivo = 'Inactivo',
}

export interface IApiCategory {
  id: number;
  name: string;
  description?: string | null;
  state: CategoryState;
  products?: IApiProduct[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Para CREAR
export type ICreateCategory = Omit<
  IApiCategory,
  'id' | 'products' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

// Para EDITAR
export type IUpdateCategory = Partial<ICreateCategory>;
