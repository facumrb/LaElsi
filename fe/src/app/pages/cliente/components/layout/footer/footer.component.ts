import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  horario1Signal = signal('Lunes a Viernes: 8 hs a 17 hs');
  horario2Signal = signal('Sábados: 9 hs a 13 hs');
}
