import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-products-list',
  imports: [CurrencyPipe],
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent {
  products = input.required<IApiProduct[]>();
  onEdit = output<IApiProduct>();
  onDelete = output<IApiProduct>();
  isFilterActive = input<boolean>(false);

  private readonly imageBaseUrl = environment.imageBaseUrl;

  // Función helper para el HTML
  getImageUrl(fileName: string): string {
    return `${this.imageBaseUrl}${fileName}`;
  }
}
