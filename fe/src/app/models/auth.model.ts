import { IApiUserPhoto } from './photo.model';
import { UserRole } from './user.model';

export interface UserSession {
  id: number;
  name: string;
  lastName: string;
  role: UserRole;
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
  lastName: string;
  dni: string;
  phone: string;
  username: string;
  email: string;
  password: string;
}
