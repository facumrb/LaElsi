import { EntityStateBadgeComponent } from '@admin/components/table-components/entity-state-badge/entity-state-badge.component';
import { TableActionsComponent } from '@admin/components/table-components/table-actions/table-actions.component';
import { CurrencyPipe } from '@angular/common';
import { Component, input, output, model } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapCheck } from '@ng-icons/bootstrap-icons';
import { TableEmptyStateComponent } from '@admin/components/table-components/table-empty-state/table-empty-state.component';

@Component({
  selector: 'app-products-list',
  imports: [
    CurrencyPipe,
    TableActionsComponent,
    NgIconComponent,
    TableEmptyStateComponent,
    EntityStateBadgeComponent,
  ],
  viewProviders: provideIcons({
    bootstrapCheck,
  }),
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent {
  products = input.required<IApiProduct[]>();
  onEdit = output<IApiProduct>();
  onDelete = output<IApiProduct>();
  isFilterActive = input<boolean>(false);

  selectedIds = model<number[]>([]);

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  isAllSelected(): boolean {
    return (
      this.products().length > 0 &&
      this.products().every((p) => this.selectedIds().includes(p.id))
    );
  }

  toggleSelect(id: number) {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedIds.set([]);
    } else {
      this.selectedIds.set(this.products().map((p) => p.id));
    }
  }

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
