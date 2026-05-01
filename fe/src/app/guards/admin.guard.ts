import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está logueado
  if (!authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  // Verificar si es Administrador
  if (authService.isAdmin()) {
    return true; // Acceso concedido
  }

  // Si está logueado pero NO es admin (es Cliente)
  router.navigate(['/']); // Lo mandamos al e-commerce
  return false;
};
