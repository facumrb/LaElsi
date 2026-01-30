import { IApiCategory } from './category.model';

export interface IApiProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  brand: string;
  total_sold: number;
  state: 'Activo' | 'Inactivo';
  stock: number;
  photos?: string[]; // Array de URLs de las fotos del producto
  category: IApiCategory;
}
