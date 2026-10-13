import { Routes } from '@angular/router';
import { adminGuard } from '@guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./pages/admin/admin.routes'),
  },
  {
    // El guestGuard se aplica pantalla por pantalla en auth.routes.ts, porque
    // la de restablecer contraseña tiene que abrirse aunque haya una sesión iniciada
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes'),
  },
  {
    path: '',
    loadChildren: () => import('./pages/client/client.routes'),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
