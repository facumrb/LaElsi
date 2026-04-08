import { Component, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapChevronUp,
  bootstrapChevronDown,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-carousel-nav',
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapChevronUp,
      bootstrapChevronDown,
    }),
  ],
  host: {
    class: 'contents',
  },
  templateUrl: './carousel-nav.component.html',
})
export class CarouselNavComponent {
  variant = input<'solid' | 'glass' | 'ghost-wrapper'>('solid');
  showControls = input(true);
  disablePrev = input(false);
  disableNext = input(false);

  prev = output<void>();
  next = output<void>();
}
