import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    role: string; //'admin', 'client'
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/users`; // Cambiado a /users/login
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  login(username: string, password: string): Observable<LoginResponse> {
    return this._http
      .post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          this.setToken(response.token);
          this.setUser(response.user);
        }),
      );
  }

  register(userData: any): Observable<any> {
    return this._http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Verificación de si el usuario tiene rol de admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'Admin';
  }

  getUser(): LoginResponse['user'] | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: LoginResponse['user']): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}
