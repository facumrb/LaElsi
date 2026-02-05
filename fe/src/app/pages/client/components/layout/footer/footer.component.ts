import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapInstagram,
  bootstrapWhatsapp,
  bootstrapGeoAlt,
  bootstrapClock,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapInstagram,
      bootstrapWhatsapp,
      bootstrapGeoAlt,
      bootstrapClock,
    }),
  ],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  horario1Signal = signal('Lunes a Viernes: 8 hs a 17 hs');
  horario2Signal = signal('Sábados: 9 hs a 13 hs');
}
