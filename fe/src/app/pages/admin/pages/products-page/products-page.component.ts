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
import { BulkPriceModalComponent } from './bulk-price-modal/bulk-price-modal.component';

interface SimpleCategory {
  id: number;
  name: string;
}

@Component({
  selector: 'app-products-page',
  imports: [
    ReactiveFormsModule,
    ProductsListComponent,
    ProductsToolbarComponent,
    BulkPriceModalComponent,
  ],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private errorService = inject(ApiErrorService);
  private apiService = inject(ApiProductService);
  private router = inject(Router);

  private productsRaw = signal<IApiProduct[]>([]);

  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('Todos');
  stockFilter = signal<StockFilter>('Todos');
  categoryFilter = signal<number | 'Todos'>('Todos');

  showBulkModal = signal(false);

  availableCategories = computed<SimpleCategory[]>(() => {
    const products = this.productsRaw();
    const uniqueCategories = new Map<number, string>();

    products.forEach((p) => {
      if (p.category) {
        uniqueCategories.set(p.category.id, p.category.name);
      }
    });

    return Array.from(uniqueCategories.entries())
      .map(([id, name]) => ({
        id,
        name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordenado alfabéticamente
  });

  filtersActive = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'Todos' ||
      this.stockFilter() !== 'Todos' ||
      this.categoryFilter() !== 'Todos'
    );
  });

  productsFiltered = computed(() => {
    // Obtenemos los valores actuales de los signals
    const currentProducts = this.productsRaw();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const stockType = this.stockFilter();
    const categoryId = this.categoryFilter();

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

      // Filtro Categoría
      const matchesCategory =
        categoryId === 'Todos' || p.category.id === Number(categoryId);

      return matchesSearch && matchesStatus && matchesStock && matchesCategory;
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

  selectedIds = signal<number[]>([]);

  handleBulkPriceUpdate() {
    if (this.selectedIds().length === 0) {
      this.alertService.toast('Selecciona al menos un producto', 'warning');
      return;
    }
    this.showBulkModal.set(true);
  }

  handleBulkSuccess() {
    this.showBulkModal.set(false);
    this.loadProducts();
    this.selectedIds.set([]); // Limpiar selección tras éxito
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.apiService.getAllProducts().subscribe({
      next: (data) => {
        this.productsRaw.set(data);
      },
      error: (err) => {
        this.errorService.handle(err, 'cargar los productos');
      },
    });
  }

  handleNavigateToCreate() {
    this.router.navigate(['/admin/products/create']);
  }

  handleNavigateToEdit(product: IApiProduct) {
    this.router.navigate(['/admin/products/edit', product.id]);
  }

  handleDelete(product: IApiProduct) {
    this.alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this.apiService.deleteProduct(product.id).subscribe({
          next: () => {
            this.alertService.toast('Producto eliminado', 'success');
            this.productsRaw.update((currentProducts) =>
              currentProducts.filter((p) => p.id !== product.id),
            );
          },
          error: (err) => {
            this.errorService.handle(err, 'eliminar el producto');
          },
        });
      }
    });
  }
}
