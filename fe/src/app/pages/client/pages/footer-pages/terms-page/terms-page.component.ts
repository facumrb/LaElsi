import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL_INFO } from '../legal-info';
import { LegalShellComponent } from '../legal-shell/legal-shell.component';

// Página pre-renderizada en el build: no usar acá servicios que dependan del navegador (ver LegalShellComponent)
@Component({
  selector: 'app-terms-page',
  imports: [RouterLink, LegalShellComponent],
  templateUrl: './terms-page.component.html',
})
export class TermsPageComponent {
  readonly legal = LEGAL_INFO;
}
