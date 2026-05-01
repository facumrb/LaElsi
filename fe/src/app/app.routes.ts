import { Routes } from '@angular/router';
import { adminGuard } from '@guards/admin.guard';
import { guestGuard } from '@guards/guest.guard';

export const AppRoutes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./pages/admin/admin.routes'),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./pages/auth/auth.routes'),
  },
  {
    path: '',
    loadChildren: () => import('./pages/client/client.routes'),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
