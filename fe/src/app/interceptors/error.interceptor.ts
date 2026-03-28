import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { ApiErrorService } from '@shared/api-error.service';
import { AuthService } from '@services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiErrorService = inject(ApiErrorService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un 401 y no es la ruta de login, intentamos refrescar el token
      if (error.status === 401 && !req.url.includes('/users/login') && !req.url.includes('/users/refresh-token')) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Re-intentamos la petición original con el nuevo token (se adjuntará en el AuthInterceptor)
            const newToken = authService.getToken();
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            // Si el refresh falla, el logout ya lo hace el AuthService internamente
            apiErrorService.handle(error, req.url);
            return throwError(() => refreshError);
          })
        );
      }

      apiErrorService.handle(error, req.url);
      return throwError(() => error);
    }),
  );
};
