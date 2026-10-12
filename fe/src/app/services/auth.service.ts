import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import {
  IApiResponse,
  LoginData,
  IClientRegister,
  UserSession,
} from '@models/auth.model';
import { UserRole } from '@models/user.model';
import { supabase } from './supabase.client';

/**
 * Autenticación con Supabase Auth.
 *
 * Hay dos piezas que conviven:
 *  - La SESIÓN (access token + refresh token): la administra el cliente de
 *    Supabase, que la guarda en localStorage y la renueva sola.
 *  - El USUARIO de la aplicación (id, nombre, rol, foto): sale de nuestra tabla
 *    "user". Se guarda una copia en localStorage para que los guards puedan
 *    decidir de forma síncrona apenas arranca la app.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly USER_KEY = 'auth_user';

  // Último access token conocido. Lo mantiene al día el listener de Supabase.
  private accessToken: string | null = null;

  currentUser = signal<UserSession | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === UserRole.Admin);

  constructor() {
    // Al iniciar la app, recuperamos la sesión si existe
    this.loadSession();
    this.listenAuthChanges();
  }

  /**
   * Inicia sesión con nombre de usuario (o email) y contraseña.
   * Pasa por la Edge Function "auth" porque Supabase Auth solo acepta email:
   * la función resuelve el usuario y devuelve los tokens de la sesión.
   */
  login(username: string, password: string): Observable<LoginData> {
    return this.http
      .post<IApiResponse<LoginData>>(`${this.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(
        map((response) => response.data),
        switchMap((data) => {
          this.saveUser(data.user);
          this.accessToken = data.token;

          // Le entregamos los tokens al cliente de Supabase: desde acá él se
          // encarga de guardarlos y de renovarlos antes de que venzan.
          return from(
            supabase.auth.setSession({
              access_token: data.token,
              refresh_token: data.refreshToken,
            }),
          ).pipe(
            map(({ error }) => {
              if (error) {
                this.clearSession();
                throw error;
              }
              return data;
            }),
          );
        }),
      );
  }

  /**
   * Inicia sesión con Google. Redirige a Google y, al volver, el cliente de
   * Supabase completa el login solo (ver listenAuthChanges).
   */
  loginWithGoogle(): Observable<void> {
    return from(
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  register(userData: IClientRegister): Observable<any> {
    return this.http
      .post<IApiResponse<any>>(`${this.apiUrl}/register`, userData)
      .pipe(map((response) => response.data));
  }

  verifyPassword(password: string): Observable<any> {
    return this.http.post<IApiResponse<any>>(`${this.apiUrl}/verify-password`, {
      password,
    });
  }

  /**
   * Renueva el access token. El cliente de Supabase ya lo hace automáticamente
   * antes de que venza; esto queda para el caso en que el backend responda 401
   * (lo usa el errorInterceptor antes de reintentar la petición).
   */
  refreshToken(): Observable<any> {
    return from(supabase.auth.refreshSession()).pipe(
      map(({ data, error }) => {
        if (error || !data.session) {
          this.logout();
          throw error ?? new Error('La sesión expiró');
        }
        this.accessToken = data.session.access_token;
        return true;
      }),
    );
  }

  logout(): void {
    // No hace falta esperar la respuesta: la sesión local se borra de inmediato
    void supabase.auth.signOut();
    this.clearSession();
    this.router.navigate(['/']);
  }

  // Método auxiliar para obtener el token (usado por el interceptor)
  getToken(): string | null {
    return this.accessToken;
  }

  /**
   * Devuelve el access token vigente esperando a que Supabase termine de leer
   * (y renovar, si hace falta) la sesión guardada. Es lo que usa el
   * authInterceptor, porque al recargar la página la sesión se recupera de
   * forma asíncrona y las primeras peticiones saldrían sin token.
   */
  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    this.accessToken = data.session?.access_token ?? null;
    return this.accessToken;
  }

  /**
   * Escucha los cambios de sesión que informa Supabase: inicio de sesión
   * (incluido el regreso desde Google), renovación del token y cierre.
   */
  private listenAuthChanges(): void {
    supabase.auth.onAuthStateChange((_event, session) => {
      this.accessToken = session?.access_token ?? null;

      if (!session) {
        // Sin sesión de Supabase no hay usuario: se limpia la copia local
        // (ej: el refresh token venció mientras la app estaba cerrada)
        this.clearSession();
        return;
      }

      // Hay sesión pero todavía no conocemos al usuario (ej: al volver de Google).
      // setTimeout: Supabase no permite llamar a su cliente dentro de este callback.
      if (!this.currentUser()) {
        setTimeout(() => this.loadProfile(), 0);
      }
    });
  }

  /** Pide al backend los datos del usuario de la sesión actual. */
  private loadProfile(): void {
    this.http.get<IApiResponse<UserSession>>(`${this.apiUrl}/me`).subscribe({
      next: (response) => this.saveUser(response.data),
      // Si no se puede obtener el perfil, la sesión no sirve: se cierra
      error: () => this.logout(),
    });
  }

  private saveUser(user: UserSession): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.USER_KEY);
    this.accessToken = null;
    this.currentUser.set(null);
  }

  private loadSession(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        this.currentUser.set(parsedUser);
      } catch (e) {
        // Si el JSON está corrupto, limpiamos todo
        this.clearSession();
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
