import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Este es un servicio dedicado principalmente para el boton de "Volver" y asi saber hacia que pagina ir.

@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService {
  private router = inject(Router);

  private history: string[] = [];

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe({
        next: (event: NavigationEnd) => {
          this.history.push(event.urlAfterRedirects);
        },
      });
  }

  // Si history_length > 1, significa que existe una ruta anterior registrada internamente
  public hasPreviousRoute(): boolean {
    return this.history.length > 1;
  }
}
