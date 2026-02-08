import { IApiUserPhoto } from './photo.model';

export enum UserRole {
  ADMIN = 'Admin',
  CLIENT = 'Client',
}

// Interfaz Base de Usuario
export interface IApiUser {
  id: number;
  name: string;
  last_name: string;
  dni: string;
  phone: string;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  photo: IApiUserPhoto | null; // Puede ser null si el usuario no cargo una foto de perfil

  // Las fechas vienen como string ISO desde la API
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// --------------- [ADMINISTRADOR] ---------------

// Interfaz Admin
export interface IApiAdmin extends IApiUser {}

export type ICreateAdmin = Omit<
  IApiAdmin,
  'id' | 'photo' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  password: string;
};
export type IUpdateAdmin = Partial<ICreateAdmin>;

// --------------- [CLIENTE] ---------------
// Interfaz Client (Hereda de User + Dirección + Facturación)
export interface IApiClient extends IApiUser {
  cuit?: string;
  fiscalCondition?: string;
  street?: string;
  streetNumber?: number;
  city?: string;
  province?: string;
  postalCode?: string;
  floor?: string;
  apartment?: string;
}

export type ICreateClient = Omit<
  IApiClient,
  'id' | 'photo' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  password: string;
};

export type IUpdateClient = Partial<ICreateClient>;
