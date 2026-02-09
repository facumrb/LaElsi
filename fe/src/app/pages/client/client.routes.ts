import { Routes } from '@angular/router';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { CarritoPageComponent } from './pages/carrito-page/carrito-page.component';
import { ImpresionesPageComponent } from './pages/impresiones-page/impresiones-page.component';
import { SellosPageComponent } from './pages/sellos-page/sellos-page.component';
import { DisenoGraficoPageComponent } from './pages/diseno-grafico-page/diseno-grafico-page.component';
import { LayoutComponent } from './components/layout/layout.component';
import { AboutUsPageComponent } from './pages/footer-pages/about-us-page/about-us-page.component';
import { FaqPageComponent } from './pages/footer-pages/faq-page/faq-page.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { ProductPageComponent } from './pages/product-page/product-page.component';
import { SearchResultComponent } from './pages/search-result/search-result.component';
import { authGuard } from '@guards/auth.guard';

export const clientRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: MainPageComponent },
      { path: 'category/:id', component: CategoryPageComponent },
      { path: 'product/:id', component: ProductPageComponent },
      { path: 'impresiones', component: ImpresionesPageComponent },
      { path: 'sellos', component: SellosPageComponent },
      { path: 'disenio', component: DisenoGraficoPageComponent },
      { path: 'about-us', component: AboutUsPageComponent },
      { path: 'faq', component: FaqPageComponent },
      {
        path: 'search',
        component: SearchResultComponent,
        title: 'Resultados de búsqueda | La Elsi',
      },
      { path: 'carrito', component: CarritoPageComponent },
      // Ruta Protegidas
      {
        path: 'profile',
        component: ProfilePageComponent,
        canActivate: [authGuard],
      },
      { path: '**', redirectTo: '' },
    ],
  },
];

export default clientRoutes;
