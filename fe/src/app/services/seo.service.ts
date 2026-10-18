import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';

export const DEFAULT_SEO_DESCRIPTION =
  'Librería y papelería Laelsi en Rosario. Impresiones, fotocopias, útiles escolares, artículos de oficina y sellos personalizados.';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly meta = inject(Meta);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute: ActivatedRoute = this.activatedRoute;

        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        const data = currentRoute.snapshot.data;
        const description: string =
          data['description'] ?? DEFAULT_SEO_DESCRIPTION;

        this.meta.updateTag({ name: 'description', content: description });
      });
  }
}
