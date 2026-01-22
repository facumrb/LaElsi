import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes'),
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes'),
  },
  {
    path: '',
    loadChildren: () => import('./pages/cliente/cliente.routes'),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
