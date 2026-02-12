import { IApiUserPhoto } from './photo.model';

export enum UserRole {
  Admin = 'Admin',
  Client = 'Client',
}

export enum FiscalCondition {
  ConsumidorFinal = 'Consumidor Final',
  ResponsableInscripto = 'Responsable Inscripto',
  Monotributista = 'Monotributista',
  Exento = 'Exento',
}

// ==========================================================
// MODELOS DE LECTURA (READ / GET)
// ==========================================================

// Interfaz Base de Usuario (sin password)
export interface IApiUser {
  id: number;
  name: string;
  last_name: string;
  dni: string;
  phone: string;
  username: string;
  email: string;
  role: UserRole;
  photo: IApiUserPhoto | null; // Puede ser null si el usuario no cargo una foto de perfil

  // Las fechas vienen como string ISO desde la API
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Interfaz Admin
export interface IApiAdmin extends IApiUser {}

// Interfaz Client (Hereda de User + Dirección + Facturación)
export interface IApiClient extends IApiUser {
  cuit?: string;
  fiscalCondition?: FiscalCondition;
  street?: string;
  streetNumber?: number;
  city?: string;
  province?: string;
  postalCode?: string;
  floor?: string;
  apartment?: string;
}

// ==========================================================
// MODELOS DE CREACIÓN (CREATE / POST)
// ==========================================================

// Helper para excluir campos automáticos
type OmitAutoFields = 'id' | 'photo' | 'createdAt' | 'updatedAt' | 'deletedAt';

// Para crear Admin
export type ICreateAdmin = Omit<IApiAdmin, OmitAutoFields> & {
  password: string;
};

// Para crear Cliente
export type ICreateClient = Omit<IApiClient, OmitAutoFields> & {
  password: string;
};

// ==========================================================
// MODELOS DE ACTUALIZACIÓN (UPDATE / PUT / PATCH)
// ==========================================================

export type IUpdateClient = Partial<Omit<IApiClient, OmitAutoFields>> & {
  password?: string;
};

export type IUpdateAdmin = Partial<Omit<IApiAdmin, OmitAutoFields>> & {
  password?: string;
};
