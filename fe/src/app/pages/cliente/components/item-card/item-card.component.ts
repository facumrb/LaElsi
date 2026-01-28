import { Component, input } from '@angular/core';
import { IApiItem } from '@models/item.model';

@Component({
  selector: 'app-item-card',
  imports: [],
  templateUrl: './item-card.component.html',
})
export class ItemCardComponent {
  product = input.required<IApiItem>();
}
