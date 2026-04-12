import { Component, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { CloseModalButtonComponent } from '@shared/components/buttons/close-modal-button/close-modal-button.component';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapWhatsapp,
  bootstrapInfoCircle,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-recover-password-modal',
  imports: [
    NgIconComponent,
    CloseModalButtonComponent,
    ClickOutsideDirective,
    A11yModule,
  ],
  viewProviders: [
    provideIcons({
      bootstrapWhatsapp,
      bootstrapInfoCircle,
    }),
  ],
  templateUrl: './recover-password-modal.component.html',
})
export class RecoverPasswordModalComponent {
  close = output<void>();

  whatsappNumber = '5493417121860';
  whatsappMessage = 'Hola, necesito recuperar mi contraseña en Laelsi';

  get whatsappLink(): string {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(this.whatsappMessage)}`;
  }
}
