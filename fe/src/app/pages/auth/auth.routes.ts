import { Routes } from '@angular/router';
import { guestGuard } from '@guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: '',
    children: [
      // Las pantallas de acceso son solo para quien NO inició sesión (guestGuard)
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/register-page/register-page.component').then(
            (m) => m.RegisterPageComponent,
          ),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/login-page/login-page.component').then(
            (m) => m.LoginPageComponent,
          ),
      },
      {
        path: 'recover-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import(
            './pages/recover-password-page/recover-password-page.component'
          ).then((m) => m.RecoverPasswordPageComponent),
      },
      // Sin guard: el enlace del correo tiene que funcionar aunque en ese
      // navegador haya quedado una sesión abierta.
      {
        path: 'reset-password',
        loadComponent: () =>
          import(
            './pages/reset-password-page/reset-password-page.component'
          ).then((m) => m.ResetPasswordPageComponent),
      },
      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];

export default authRoutes;
