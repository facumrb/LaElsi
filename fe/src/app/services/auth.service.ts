import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap, BehaviorSubject, filter, take, switchMap, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import {
  IApiResponse,
  LoginData,
  RegisterData,
  IClientRegister,
  UserSession,
} from '@models/auth.model';
import { UserRole } from '@models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly USER_KEY = 'auth_user';

  private isRefreshing = signal(false);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  currentUser = signal<UserSession | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === UserRole.Admin);

  constructor() {
    // Al iniciar la app, recuperamos la sesión si existe
    this.loadSession();
  }

  login(username: string, password: string): Observable<LoginData> {
    return this.http
      .post<IApiResponse<LoginData>>(`${this.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(
        map((response) => response.data),
        tap((data) => {
          this.saveSession(data.token, data.refreshToken, data.user);
        }),
      );
  }

  register(userData: RegisterData | IClientRegister): Observable<any> {
    return this.http
      .post<IApiResponse<any>>(`${this.apiUrl}/register`, userData)
      .pipe(map((response) => response.data));
  }

  refreshToken(): Observable<any> {
    if (this.isRefreshing()) {
      // Si ya se está refrescando, esperamos al nuevo token
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap(() => {
          // El token ya se actualizó en el pipe original, así que simplemente retornamos un observable "vacio" exitoso
          // El interceptor usará el nuevo getToken()
          return new Observable((subscriber) => {
            subscriber.next(true);
            subscriber.complete();
          });
        })
      );
    }

    this.isRefreshing.set(true);
    this.refreshTokenSubject.next(null);

    const refreshToken = this.getRefreshToken();
    return this.http
      .post<IApiResponse<{ token: string; refreshToken: string }>>(
        `${this.apiUrl}/refresh-token`,
        { refreshToken }
      )
      .pipe(
        map((response) => response.data),
        tap((data) => {
          this.isRefreshing.set(false);
          this.saveTokens(data.token, data.refreshToken);
          this.refreshTokenSubject.next(data.token);
        }),
        catchError((err) => {
          this.isRefreshing.set(false);
          this.logout();
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  // Método auxiliar para obtener el token (usado por el interceptor)
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private saveSession(token: string, refreshToken: string, user: UserSession): void {
    this.saveTokens(token, refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private saveTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private loadSession(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (storedUser && token) {
      // Verificar si el token expiró antes de cargar la sesión
      if (this.isTokenExpired(token)) {
        this.logout();
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        this.currentUser.set(parsedUser);
      } catch (e) {
        // Si el JSON está corrupto, limpiamos todo
        this.logout();
      }
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch (e) {
      return true; // Si no se puede parsear, asumimos expirado por seguridad
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
