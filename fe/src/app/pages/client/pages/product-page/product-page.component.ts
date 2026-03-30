import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiProductService } from '@services/api-product.service';
import { IApiProduct } from '@models/product.model';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { environment } from 'src/environments/environment';
import { ProductStatusBadgeComponent } from '@shared/components/product-status-badge/product-status-badge.component';
import {
  BreadcrumbsComponent,
  BreadcrumbStep,
} from '@shared/components/breadcrumbs/breadcrumbs.component';
import { IApiCategory } from '@models/category.model';
import { AddToCartControlComponent } from '@shared/components/add-to-cart-control/add-to-cart-control.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCheckLg,
  bootstrapShieldCheck,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapChevronDown,
  bootstrapChevronUp,
  bootstrapLightningFill,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-product-page',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgIconComponent,
    BreadcrumbsComponent,
    ProductStatusBadgeComponent,
    AddToCartControlComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapCheckLg,
      bootstrapShieldCheck,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapChevronUp,
      bootstrapChevronDown,
      bootstrapLightningFill,
    }),
  ],
  templateUrl: './product-page.component.html',
})
export class ProductPageComponent implements OnInit {
  private readonly imageBaseUrl = environment.productImagesUrl;
  private readonly defaultImage = 'assets/Webp/no-image.webp';
  private activatedRoute = inject(ActivatedRoute);
  private productService = inject(ApiProductService);
  private router = inject(Router);

  product = signal<IApiProduct | undefined>(undefined);
  selectedPhotoUrl = signal<string | undefined>(undefined);
  thumbnailIndex = signal(0);

  // Breadcrumbs
  breadcrumbSteps = computed<BreadcrumbStep[]>(() => {
    const prod = this.product();
    if (!prod || !prod.category) return [];

    const steps: BreadcrumbStep[] = [];

    const buildPath = (current: IApiCategory) => {
      steps.unshift({
        label: current.name,
        url: `/category/${current.id}`,
      });
      if (current.parent) {
        buildPath(current.parent);
      }
    };

    buildPath(prod.category);

    // Agregamos el producto al final
    steps.push({ label: prod.name });

    return steps;
  });

  // Computed signals for derived state
  productPrice = computed(() => {
    const currentPrice = this.product()?.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.amount : 0;
  });

  productCurrency = computed(() => {
    const currentPrice = this.product()?.prices?.find((p) => p.isCurrent);
    return currentPrice ? currentPrice.currency : 'ARS';
  });

  ngOnInit(): void {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product.set(data);
        // Al cargar, seteamos la primera foto si existe
        if (data.photos && data.photos.length > 0) {
          this.selectedPhotoUrl.set(this.buildUrl(data.photos[0].fileName));
        } else {
          this.selectedPhotoUrl.set(this.defaultImage);
        }
      },
      error: () => this.router.navigate(['/']),
    });
  }

  // Función auxiliar para construir la URL en el HTML y el TS
  buildUrl(fileName: string): string {
    return `${this.imageBaseUrl}${fileName}`;
  }

  // Lógica para navegar el carrusel de la foto principal
  nextPhoto() {
    const currentProduct = this.product();
    if (!currentProduct?.photos?.length) return;

    const photos = currentProduct.photos;
    const currentIndex = photos.findIndex(
      (p) => this.buildUrl(p.fileName) === this.selectedPhotoUrl(),
    );
    const nextIndex = (currentIndex + 1) % photos.length;
    this.selectedPhotoUrl.set(this.buildUrl(photos[nextIndex].fileName));
  }

  prevPhoto() {
    const currentProduct = this.product();
    if (!currentProduct?.photos?.length) return;

    const photos = currentProduct.photos;
    const currentIndex = photos.findIndex(
      (p) => this.buildUrl(p.fileName) === this.selectedPhotoUrl(),
    );
    const prevIndex =
      currentIndex === -1
        ? photos.length - 1
        : (currentIndex - 1 + photos.length) % photos.length;
    this.selectedPhotoUrl.set(this.buildUrl(photos[prevIndex].fileName));
  }

  nextThumbnails() {
    const currentProduct = this.product();
    if (
      currentProduct?.photos &&
      this.thumbnailIndex() + 5 < currentProduct.photos.length
    ) {
      this.thumbnailIndex.update((v) => v + 5);
    }
  }

  prevThumbnails() {
    if (this.product()?.photos && this.thumbnailIndex() > 0) {
      this.thumbnailIndex.update((v) => v - 5);
    }
  }
}
