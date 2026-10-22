import { afterNextRender, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { LEGAL_INFO } from '../legal-info';

/**
 * Marco liviano de las páginas legales (encabezado con el logo, contenido y pie con los enlaces).
 *
 * Estas páginas se PRE-RENDERIZAN en el build (ver app.routes.server.ts), así que este componente
 * y todo lo que use NO puede depender de localStorage, window ni del API. Por eso no reutiliza el
 * layout de la tienda. Si necesita algo del navegador, tiene que ir dentro de afterNextRender.
 */
@Component({
  selector: 'app-legal-shell',
  imports: [RouterLink, LogoComponent],
  templateUrl: './legal-shell.component.html',
})
export class LegalShellComponent {
  readonly legal = LEGAL_INFO;

  constructor() {
    // Los textos son largos: al entrar, o al pasar de uno a otro, se arranca desde arriba.
    // afterNextRender solo corre en el navegador, no durante el pre-renderizado del build.
    afterNextRender(() => window.scrollTo({ top: 0 }));
  }
}
