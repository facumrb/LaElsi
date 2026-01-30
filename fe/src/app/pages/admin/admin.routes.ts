import { Routes } from '@angular/router';
import { LayoutComponent } from '@admin/components/layout/layout.component';
import { adminGuard } from '@services/admin.guard';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';
import { ProductsPageComponent } from './pages/products-page/products-page.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { ViewProfilePageComponent } from './pages/view-profile-page/view-profile-page.component';
import { EditProfilePageComponent } from './pages/edit-profile-page/edit-profile-page.component';

export const adminRoutes: Routes = [
  {
    path: '',
    //canActivate: [adminGuard],
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'usuarios', component: UsersPageComponent },
      { path: 'categories', component: CategoriesPageComponent },
      { path: 'products', component: ProductsPageComponent },
      { path: 'orders', component: OrdersPageComponent },
      { path: 'view-profile/:id', component: ViewProfilePageComponent },
      { path: 'edit-profile/:id', component: EditProfilePageComponent },
      { path: '**', redirectTo: '' },
    ],
  },
];

export default adminRoutes;
