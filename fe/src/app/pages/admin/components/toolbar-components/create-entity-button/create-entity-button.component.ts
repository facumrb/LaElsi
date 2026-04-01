import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPlusLg } from '@ng-icons/bootstrap-icons';

// Botón genérico para la creación de entidades.

@Component({
  selector: 'app-create-entity-button',
  imports: [NgIconComponent],
  host: {
    class: 'block w-full h-full sm:w-auto',
  },
  viewProviders: [
    provideIcons({
      bootstrapPlusLg,
    }),
  ],
  templateUrl: './create-entity-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEntityButtonComponent {
  // Texto a mostrar junto al simbolo "+"
  label = input.required<string>();

  clicked = output<void>();
}
