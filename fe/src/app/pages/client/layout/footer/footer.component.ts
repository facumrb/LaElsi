import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapInstagram,
  bootstrapWhatsapp,
  bootstrapGeoAlt,
  bootstrapClock,
  bootstrapEnvelope,
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
      bootstrapEnvelope,
    }),
  ],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  horario1Signal = signal('Lunes a Viernes: 8:00 a 17:00');
  horario2Signal = signal('Sábados: 9:00 a 13:00');
  currentYear = signal(new Date().getFullYear());
}
