import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiProductService } from '@services/api-product.service';
import { IApiProduct } from '@models/product.model';
import { CurrencyPipe } from '@angular/common';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-page.component.html',
})
export class ProductPageComponent implements OnInit {
  // Cambia esto por la URL real de tu backend
  private readonly imageBaseUrl = environment.imageBaseUrl;

  product?: IApiProduct;
  selectedPhotoUrl?: string; // Aquí guardaremos la URL completa de la foto visible

  constructor(
    private route: ActivatedRoute,
    private productService: ApiProductService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        // Al cargar, seteamos la primera foto si existe
        if (data.photos && data.photos.length > 0) {
          this.selectedPhotoUrl = this.buildUrl(data.photos[0].fileName);
        }
      },
      error: (err) => console.error('Error al cargar el producto', err),
    });
  }

  // Función auxiliar para construir la URL en el HTML y el TS
  buildUrl(fileName: string): string {
    return `${this.imageBaseUrl}${fileName}`;
  }

  addToCart() {
    console.log('Producto añadido al carrito:', this.product?.name);
  }

  getProductPrice(): number {
    const currentPrice = this.product?.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.amount : 0;
  }

  getProductCurrency(): string {
    const currentPrice = this.product?.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.currency : 'ARS';
  }
}
