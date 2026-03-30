import { Component, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPlusLg } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-create-entity-button',
  imports: [NgIconComponent],
  host: {
    class: 'block w-full h-full lg:w-auto md:w-auto sm:w-auto',
  },
  viewProviders: [
    provideIcons({
      bootstrapPlusLg,
    }),
  ],
  templateUrl: './create-entity-button.component.html',
})
export class CreateEntityButtonComponent {
  label = input.required<string>();
  clicked = output<void>();
}
