import { IApiProduct } from './product.model';

export enum CategoryState {
  Activo = 'Activo',
  Inactivo = 'Inactivo',
}

export interface IApiCategory {
  id: number;
  name: string;
  description?: string | null;
  order: number;
  state: CategoryState;
  parentId?: number | null;
  parent?: IApiCategory | null;
  children?: IApiCategory[];
  depth?: number;
  products?: IApiProduct[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Para CREAR
export type ICreateCategory = Omit<
  IApiCategory,
  'id' | 'products' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'parent' | 'children' | 'depth' | 'order'
> & {
  parentId?: number | null;
  order?: number;
};

// Para EDITAR
export type IUpdateCategory = Partial<ICreateCategory>;
