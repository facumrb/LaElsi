import { Component, input } from '@angular/core';
import { IApiProduct } from '@models/product.model';

@Component({
  selector: 'app-product-card',
  imports: [],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  // Recibimos el item desde el @for del padre
  product = input.required<IApiProduct>();
}
