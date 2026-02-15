import { IApiUserPhoto } from './photo.model';
import { UserRole } from './user.model';

export interface UserSession {
  id: number;
  name: string;
  lastName: string;
  role: UserRole;
  photo?: IApiUserPhoto | null;
}

export interface LoginData {
  token: string;
  user: UserSession;
}

export interface IApiResponse<T> {
  status: string;
  message: string;
  data: T;
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
