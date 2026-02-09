import { IApiUserPhoto } from './photo.model';
import { UserRole } from './user.model';

export interface UserSession {
  id: number;
  name: string;
  role: UserRole;
  email?: string;
  photo?: IApiUserPhoto | null;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserSession;
}

// Interfaz para el registro
export interface RegisterData {
  name: string;
  last_name: string;
  dni: string;
  phone: string;
  username: string;
  email: string;
  password: string;
}
