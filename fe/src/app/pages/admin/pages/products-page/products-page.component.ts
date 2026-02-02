import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiProductService } from '@services/api-product.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { ProductsListComponent } from './products-list/products-list.component';
import {
  ProductsToolbarComponent,
  StockFilter,
} from './products-toolbar/products-toolbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProductsListComponent,
    ProductsToolbarComponent,
  ],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiProductService);
  private _router = inject(Router);

  public products = signal<IApiProduct[]>([]);

  searchQuery = signal('');
  statusFilter = signal<'Todos' | 'Activo' | 'Inactivo'>('Todos');
  stockFilter = signal<StockFilter>('Todos');

  productsFiltered = computed(() => {
    // Aquí implementaremos la lógica de filtrado luego
  });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this._apiService.getAllProducts().subscribe({
      next: (data) => {
        this.products.set(data);
      },
      error: (err) => {
        this._errorService.handle(err, 'cargar los productos');
      },
    });
  }

  handleNavigateToCreate() {
    this._router.navigate(['/admin/products/create']);
  }

  handleNavigateToEdit(product: IApiProduct) {
    this._router.navigate(['/admin/products/edit', product.id]);
  }

  handleDelete(product: IApiProduct) {
    this._alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this._apiService.deleteProduct(product.id).subscribe({
          next: () => {
            this._alertService.toast('Producto eliminado', 'success');
            this.products.update((currentProducts) =>
              currentProducts.filter((p) => p.id !== product.id),
            );
          },
          error: (err) => {
            this._errorService.handle(err, 'eliminar el producto');
          },
        });
      }
    });
  }
}
