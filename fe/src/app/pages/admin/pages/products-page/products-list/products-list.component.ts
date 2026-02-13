import { TableActionsComponent } from '@admin/components/table-actions/table-actions.component';
import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapInbox } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-products-list',
  imports: [CurrencyPipe, TableActionsComponent, NgIconComponent],
  viewProviders: provideIcons({ bootstrapSearch, bootstrapInbox }),
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent {
  products = input.required<IApiProduct[]>();
  onEdit = output<IApiProduct>();
  onDelete = output<IApiProduct>();
  isFilterActive = input<boolean>(false);

  private readonly imageBaseUrl = environment.productImagesUrl;

  private getImageUrl(fileName: string | undefined): string {
    return `${this.imageBaseUrl}${fileName}`;
  }

  getProductMainImage(product: IApiProduct): string {
    if (product.photos && product.photos.length > 0) {
      return this.getImageUrl(product.photos[0].fileName);
    }
    return 'assets/Webp/no-image.webp';
  }

  getProductPrice(product: IApiProduct): number {
    const currentPrice = product.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.amount : 0;
  }

  getProductCurrency(product: IApiProduct): string {
    const currentPrice = product.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.currency : 'ARS';
  }
}
