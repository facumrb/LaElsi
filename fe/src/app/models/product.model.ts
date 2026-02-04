import { IApiCategory } from './category.model';
import { IApiProductPhoto } from './photo.model';

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
  total_sold: number;
  state: 'Activo' | 'Inactivo';
  stock: number;
  photos: IApiProductPhoto[]; // Array de URLs de las fotos del producto
  category: IApiCategory;
}

export interface ICreateProduct {
  name: string;
  description: string;
  price: number; // El formulario sigue enviando un número simple que el BE convierte
  currency?: string;
  brand: string;
  total_sold: number;
  state: 'Activo' | 'Inactivo';
  stock: number;
  categoryId: number; // Enviamos el ID de la categoria que tenga
}
