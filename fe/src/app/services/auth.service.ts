import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import {
  IApiResponse,
  LoginData,
  RegisterData,
  UserSession,
} from '@models/auth.model';
import { UserRole } from '@models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  currentUser = signal<UserSession | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === UserRole.Admin);

  constructor() {
    // Al iniciar la app, recuperamos la sesión si existe
    this.loadSession();
  }

  login(username: string, password: string): Observable<LoginData> {
    return this._http
      .post<IApiResponse<LoginData>>(`${this.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(
        map((response) => response.data),
        tap((data) => {
          this.saveSession(data.token, data.user);
        }),
      );
  }

  register(userData: RegisterData): Observable<any> {
    return this._http
      .post<IApiResponse<any>>(`${this.apiUrl}/register`, userData)
      .pipe(map((response) => response.data));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this._router.navigate(['/']);
  }

  // Método auxiliar para obtener el token (usado por el interceptor)
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveSession(token: string, user: UserSession): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadSession(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        this.currentUser.set(parsedUser);
      } catch (e) {
        // Si el JSON está corrupto, limpiamos todo
        this.logout();
      }
    }
  }

  updateCurrentUser(updates: Partial<UserSession>): void {
    const currentUser = this.currentUser();

    if (currentUser) {
      // 1. Creamos el nuevo objeto mezclando lo actual con los cambios
      const updatedUser: UserSession = {
        ...currentUser,
        ...updates,
      };

      // 2. Actualizamos el Signal (Reactividad en la UI)
      this.currentUser.set(updatedUser);

      // 3. Actualizamos el LocalStorage (Persistencia al recargar página)
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    }
  }
}
