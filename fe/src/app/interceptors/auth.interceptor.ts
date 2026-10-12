import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { environment } from 'src/environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo se autentican las peticiones a nuestro backend (Edge Functions y API de Supabase).
  // Las demás deben salir intactas: en particular, la subida de imágenes a Cloudflare R2
  // usa una URL prefirmada, y agregarle el header Authorization hace que R2 la rechace.
  if (!req.url.startsWith(environment.supabaseUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);

  // Se espera a que Supabase tenga lista la sesión (al recargar la página la
  // recupera de forma asíncrona y la renueva si el token ya venció).
  return from(authService.getAccessToken()).pipe(
    switchMap((token) => {
      // apikey identifica al proyecto de Supabase (es la clave pública).
      const headers: Record<string, string> = {
        apikey: environment.supabaseAnonKey,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return next(req.clone({ setHeaders: headers }));
    }),
  );
};
