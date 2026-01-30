import { IApiCategory } from './category.model';
import { IApiPhoto } from './foto.model';

export interface IApiProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  brand: string;
  total_sold: number;
  state: 'Activo' | 'Inactivo';
  stock: number;
  photos: IApiPhoto[]; // Array de URLs de las fotos del producto
  category: IApiCategory;
}
