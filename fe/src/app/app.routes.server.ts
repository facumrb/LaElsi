import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Qué se pre-renderiza en el build (outputMode "static" en angular.json).
 *
 * Solo las dos páginas legales: Google (y cualquier robot que lea el HTML sin ejecutar JavaScript)
 * tiene que ver el texto de la política y de los términos. El resto sigue siendo una SPA normal.
 *
 * Una ruta nueva entra en el pre-renderizado SOLO si su componente (y todo lo que usa) no depende
 * del navegador ni del API: nada de localStorage, window, HttpClient ni AuthService/CartService
 * en el camino. El layout de la tienda sí los usa, por eso las páginas legales viven fuera de él.
 *
 * El build genera <ruta>/index.html para cada ruta pre-renderizada. El resto de las rutas usa
 * index.csr.html (ver vercel.json).
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'privacidad', renderMode: RenderMode.Prerender },
  { path: 'terminos', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
