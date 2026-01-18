import { Routes } from '@angular/router';
import { LoginHomeComponent } from './pages/login-home/login-home.component';
import { HomeComponent } from './pages/admin/home/home.component';
import { adminGuard } from './services/admin.guard';
import { EditProfileComponent } from './pages/admin/edit-profile/edit-profile.component';
import { ViewProfileComponent } from './pages/admin/view-profile/view-profile.component';
import { CategoriasComponent } from './pages/admin/categorias/categorias.component';
import { ItemsComponent } from './pages/admin/items/items.component';
import { UsuariosComponent } from './pages/admin/usuarios/usuarios.component';
import { MainPageComponent } from './pages/cliente/main-page/main-page.component';
import { PerfilPageComponent } from './pages/cliente/perfil-page/perfil-page.component';
import { CarritoPageComponent } from './pages/cliente/carrito-page/carrito-page.component';
import { ComputacionPageComponent } from './pages/cliente/computacion-page/computacion-page.component';
import { JugueteriaPageComponent } from './pages/cliente/jugueteria-page/jugueteria-page.component';
import { LibreriaPageComponent } from './pages/cliente/libreria-page/libreria-page.component';
import { ImpresionesPageComponent } from './pages/cliente/impresiones-page/impresiones-page.component';
import { SellosPageComponent } from './pages/cliente/sellos-page/sellos-page.component';
import { DisenoGraficoPageComponent } from './pages/cliente/diseno-grafico-page/diseno-grafico-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginHomeComponent },
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
  // { path: '**', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'cliente',
    children: [
      { path: 'main', component: MainPageComponent },
      { path: 'perfil', component: PerfilPageComponent },
      { path: 'carrito', component: CarritoPageComponent },
      { path: 'computacion', component: ComputacionPageComponent },
      { path: 'jugueteria', component: JugueteriaPageComponent },
      { path: 'libreria', component: LibreriaPageComponent },
      { path: 'impresiones', component: ImpresionesPageComponent },
      { path: 'sellos', component: SellosPageComponent },
      { path: 'disenio', component: DisenoGraficoPageComponent },
    ],
  },
];
