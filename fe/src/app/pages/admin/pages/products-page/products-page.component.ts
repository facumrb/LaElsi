import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiProductService } from '@services/api-product.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { ProductsListComponent } from './products-list/products-list.component';
import {
  ProductsToolbarComponent,
  StatusFilter,
  StockFilter,
} from './products-toolbar/products-toolbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products-page',
  imports: [
    ReactiveFormsModule,
    ProductsListComponent,
    ProductsToolbarComponent,
  ],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiProductService);
  private _router = inject(Router);

  private productsRaw = signal<IApiProduct[]>([]);

  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('Todos');
  stockFilter = signal<StockFilter>('Todos');

  filtersActive = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'Todos' ||
      this.stockFilter() !== 'Todos'
    );
  });

  productsFiltered = computed(() => {
    // Obtenemos los valores actuales de los signals
    const currentProducts = this.productsRaw();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const stockType = this.stockFilter();

    // Aplicamos filtros (Search, Status, Stock)
    let filtered = currentProducts.filter((p) => {
      // Filtro de Búsqueda (Nombre, descripcion o Marca)
      const matchesSearch =
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query);

      // Filtro de Estado
      const matchesStatus = status === 'Todos' || p.state === status;

      // Filtro de Stock
      let matchesStock = true;
      if (stockType === 'AltoStock') matchesStock = p.stock > 10;
      if (stockType === 'BajoStock') matchesStock = p.stock <= 10;
      if (stockType === 'SinStock') matchesStock = p.stock === 0;
      // Nota: 'MasProductos' y 'MenosProductos' no filtran, solo ordenan,
      // así que aquí pasan como true.

      return matchesSearch && matchesStatus && matchesStock;
    });

    // Ordenamiento
    if (stockType === 'MasProductos') {
      // Ordenar de Mayor a Menor stock
      filtered.sort((a, b) => b.stock - a.stock);
    } else if (stockType === 'MenosProductos') {
      // Ordenar de Menor a Mayor stock
      filtered.sort((a, b) => a.stock - b.stock);
    } else {
      filtered.sort((a, b) => a.id - b.id);
    }

    return filtered;
  });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this._apiService.getAllProducts().subscribe({
      next: (data) => {
        this.productsRaw.set(data);
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
            this.productsRaw.update((currentProducts) =>
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
