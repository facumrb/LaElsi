import { Routes } from '@angular/router';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { PerfilPageComponent } from './pages/perfil-page/perfil-page.component';
import { CarritoPageComponent } from './pages/carrito-page/carrito-page.component';
import { ImpresionesPageComponent } from './pages/impresiones-page/impresiones-page.component';
import { SellosPageComponent } from './pages/sellos-page/sellos-page.component';
import { DisenoGraficoPageComponent } from './pages/diseno-grafico-page/diseno-grafico-page.component';
import { LayoutComponent } from './components/layout/layout.component';
import { AboutUsPageComponent } from './pages/about-us-page/about-us-page.component';
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { ProductPageComponent } from './pages/product-page/product-page.component';

export const clienteRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: MainPageComponent },
      { path: 'perfil', component: PerfilPageComponent },
      { path: 'carrito', component: CarritoPageComponent },
      { path: 'category/:name', component: CategoryPageComponent },
      { path: 'product/:id', component: ProductPageComponent },
      { path: 'impresiones', component: ImpresionesPageComponent },
      { path: 'sellos', component: SellosPageComponent },
      { path: 'disenio', component: DisenoGraficoPageComponent },
      { path: 'about-us', component: AboutUsPageComponent },
      { path: 'faq', component: FaqPageComponent },
      { path: '**', redirectTo: '' },
    ],
  },
];

export default clienteRoutes;
