import { Routes } from '@angular/router';
import { authGuard } from '@guards/auth.guard';

export const clientRoutes: Routes = [
  {
    path: '',
    // Cargamos el Layout base del cliente
    loadComponent: () =>
      import('./components/layout/layout.component').then(
        (m) => m.LayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/main-page/main-page.component').then(
            (m) => m.MainPageComponent,
          ),
      },
      {
        path: 'category/:id',
        loadComponent: () =>
          import('./pages/category-page/category-page.component').then(
            (m) => m.CategoryPageComponent,
          ),
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import('./pages/product-page/product-page.component').then(
            (m) => m.ProductPageComponent,
          ),
      },
      {
        path: 'impresiones',
        loadComponent: () =>
          import('./pages/impresiones-page/impresiones-page.component').then(
            (m) => m.ImpresionesPageComponent,
          ),
      },
      {
        path: 'sellos',
        loadComponent: () =>
          import('./pages/sellos-page/sellos-page.component').then(
            (m) => m.SellosPageComponent,
          ),
      },
      {
        path: 'disenio',
        loadComponent: () =>
          import('./pages/diseno-grafico-page/diseno-grafico-page.component').then(
            (m) => m.DisenoGraficoPageComponent,
          ),
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('./pages/footer-pages/about-us-page/about-us-page.component').then(
            (m) => m.AboutUsPageComponent,
          ),
      },
      {
        path: 'faq',
        loadComponent: () =>
          import('./pages/footer-pages/faq-page/faq-page.component').then(
            (m) => m.FaqPageComponent,
          ),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./pages/search-result/search-result.component').then(
            (m) => m.SearchResultComponent,
          ),
        title: 'Resultados de búsqueda | La Elsi',
      },
      {
        path: 'carrito',
        loadComponent: () =>
          import('./pages/carrito-page/carrito-page.component').then(
            (m) => m.CarritoPageComponent,
          ),
      },
      // Ruta Protegida
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
        canActivate: [authGuard],
      },
      { path: '**', redirectTo: '' },
    ],
  },
];

export default clientRoutes;
