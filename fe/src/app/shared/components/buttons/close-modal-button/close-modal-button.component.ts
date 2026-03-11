import { Component, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapX } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-close-modal-button',
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapX,
    }),
  ],
  templateUrl: './close-modal-button.component.html',
})
export class CloseModalButtonComponent {
  clicked = output<void>();
}
