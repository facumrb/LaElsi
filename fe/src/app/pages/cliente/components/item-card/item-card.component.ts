import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-card.component.html',
})
export class ItemCardComponent {
  // Recibimos el item desde el @for del padre
  @Input({ required: true }) product: any;
}
