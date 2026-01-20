import { Routes } from '@angular/router';
import { HomeComponent } from './pages/admin/home/home.component';
import { adminGuard } from './services/admin.guard';
import { EditProfileComponent } from './pages/admin/pages/edit-profile/edit-profile.component';
import { ViewProfileComponent } from './pages/admin/pages/view-profile/view-profile.component';
import { CategoriasComponent } from './pages/admin/pages/categorias/categorias.component';
import { ItemsComponent } from './pages/admin/pages/items/items.component';
import { UsuariosComponent } from './pages/admin/pages/usuarios/usuarios.component';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'view-profile/:id', component: ViewProfileComponent },
      { path: 'edit-profile/:id', component: EditProfileComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'categorias', component: CategoriasComponent },
      { path: 'items', component: ItemsComponent },
    ],
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
