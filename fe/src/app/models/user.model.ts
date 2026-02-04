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

  // Las fechas vienen como string ISO desde la API
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // Puede ser undefined o null
}

// Interfaz Admin
export interface IApiAdmin extends IApiUser {
  // Si en el futuro agregas propiedades exclusivas de Admin, van aquí.
}

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
