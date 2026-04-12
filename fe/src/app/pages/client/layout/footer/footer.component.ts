import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapInstagram,
  bootstrapWhatsapp,
  bootstrapGeoAlt,
  bootstrapClock,
} from '@ng-icons/bootstrap-icons';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, NgIconComponent, LogoComponent],
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
  horario1Signal = signal('Lunes a Viernes: 8:00 a 17:00');
  horario2Signal = signal('Sábados: 9:00 a 13:00');
  currentYear = signal(new Date().getFullYear());

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
