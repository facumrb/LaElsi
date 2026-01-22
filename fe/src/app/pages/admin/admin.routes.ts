import { Routes } from '@angular/router';
import { LayoutComponent } from '@admin/components/layout/layout.component';
import { adminGuard } from '@services/admin.guard';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { UsuariosPageComponent } from './pages/usuarios-page/usuarios-page.component';
import { CategoriasPageComponent } from './pages/categorias-page/categorias-page.component';
import { ProductosPageComponent } from './pages/productos-page/productos-page.component';
import { PedidosPageComponent } from './pages/pedidos-page/pedidos-page.component';
import { ViewProfilePageComponent } from './pages/view-profile-page/view-profile-page.component';
import { EditProfilePageComponent } from './pages/edit-profile-page/edit-profile-page.component';

export const adminRoutes: Routes = [
  {
    path: '',
    //canActivate: [adminGuard],
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'usuarios', component: UsuariosPageComponent },
      { path: 'categorias', component: CategoriasPageComponent },
      { path: 'productos', component: ProductosPageComponent },
      { path: 'pedidos', component: PedidosPageComponent },
      { path: 'view-profile/:id', component: ViewProfilePageComponent },
      { path: 'edit-profile/:id', component: EditProfilePageComponent },
      { path: '**', redirectTo: '' },
    ],
  },
];

export default adminRoutes;
