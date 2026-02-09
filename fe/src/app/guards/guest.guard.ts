import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si YA está logueado, no debería estar aquí. Lo mandamos al home.
  if (authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  // Si NO está logueado, puede pasar.
  return true;
};
