import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiProductService } from '@services/api-product.service';
import { ApiCategoryService } from '@services/api-category.service';
import { ProductCardComponent } from '@cliente/components/product-card/product-card.component';
import { IApiCategory } from '@models/category.model';
import { IApiProduct } from '@models/product.model';

@Component({
  selector: 'app-category-page',
  imports: [ProductCardComponent],
  templateUrl: './category-page.component.html',
})
export class CategoryPageComponent implements OnInit {
  public products = signal<IApiProduct[]>([]);
  public category = signal<IApiCategory | null>(null);

  private ApiCategoryService = inject(ApiCategoryService);
  private ApiProductService = inject(ApiProductService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const name = params['name'];
      this.cargarDatosDePagina(name);
    });
  }

  cargarDatosDePagina(name: string) {
    // 1. Llamamos a la función para obtener el nombre de la categoría
    this.ApiCategoryService.getCategoryByName(name).subscribe({
      next: (data) => this.category.set(data),
      error: (err) => console.error('Error al obtener categoría', err),
    });

    // 2. Llamamos a la función que ya teníamos para los productos
    this.ApiProductService.getProductsByCategory(name).subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Error al obtener productos', err),
    });
  }
}
