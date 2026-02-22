import { IApiCategory } from './category.model';
import { IApiProductPhoto } from './photo.model';

export enum ProductState {
  Activo = 'Activo',
  Inactivo = 'Inactivo',
}

export interface IApiPrice {
  id: number;
  amount: number;
  currency: string;
  validFrom: string;
  isCurrent: boolean;
}

export interface IApiProduct {
  id: number;
  name: string;
  description: string;
  prices: IApiPrice[];
  brand: string;
  totalSold: number;
  state: ProductState;
  stock: number;
  photos: IApiProductPhoto[]; // Array de URLs de las fotos del producto
  category: IApiCategory;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ICreateProduct = Omit<
  IApiProduct,
  | 'id'
  | 'photos'
  | 'category'
  | 'prices'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
> & {
  price: number;
  category: number;
};

export type IUpdateProduct = Partial<ICreateProduct>;

// Las siguientes son interfaces para almacenar el estado de un producto en edición
export interface IProductDraftForm {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  brand?: string | null;
  totalSold?: number | null;
  stock?: number | null;
  state?: ProductState | null;
  category?: IApiCategory | null;
  photos?: any[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface IProductDraft {
  formValue: IProductDraftForm;
  isEditMode: boolean;
  productId: number | null;
  photos: IApiProductPhoto[] | any[];
  photosToDeleteIds: number[];
  returnUrl: string;
}
