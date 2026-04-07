import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiProductService } from '@services/api-services/api-product.service';
import { IApiProduct } from '@models/product.model';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { environment } from 'src/environments/environment';
import { ProductStatusBadgeComponent } from '@client/components/product-status-badge/product-status-badge.component';
import {
  BreadcrumbsComponent,
  BreadcrumbStep,
} from '@client/components/breadcrumbs/breadcrumbs.component';
import { IApiCategory } from '@models/category.model';
import { AddToCartControlComponent } from '@client/components/add-to-cart-control/add-to-cart-control.component';
import { ProductImageComponent } from '@shared/components/product-image/product-image.component';
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
    ProductImageComponent,
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
  private activatedRoute = inject(ActivatedRoute);
  private productService = inject(ApiProductService);
  private router = inject(Router);

  product = signal<IApiProduct | undefined>(undefined);
  selectedPhotoFileName = signal<string | null>(null);
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

  productPhotos = computed(() => {
    return this.product()?.photos || [];
  });

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
          this.selectedPhotoFileName.set(data.photos[0].fileName);
        } else {
          this.selectedPhotoFileName.set(null);
        }
      },
      error: () => this.router.navigate(['/']),
    });
  }

  // Lógica para navegar el carrusel de la foto principal
  nextPhoto() {
    const photos = this.productPhotos();
    if (!photos.length) return;
    const currentIndex = photos.findIndex(
      (p) => p.fileName === this.selectedPhotoFileName(),
    );
    const nextIndex = (currentIndex + 1) % photos.length;
    this.selectedPhotoFileName.set(photos[nextIndex].fileName);
  }

  prevPhoto() {
    const photos = this.productPhotos();
    if (!photos.length) return;
    const currentIndex = photos.findIndex(
      (p) => p.fileName === this.selectedPhotoFileName(),
    );
    const prevIndex =
      currentIndex === -1
        ? photos.length - 1
        : (currentIndex - 1 + photos.length) % photos.length;
    this.selectedPhotoFileName.set(photos[prevIndex].fileName);
  }

  nextThumbnails() {
    const photos = this.productPhotos();
    if (photos.length && this.thumbnailIndex() + 5 < photos.length) {
      this.thumbnailIndex.update((v) => v + 5);
    }
  }

  prevThumbnails() {
    if (this.productPhotos().length && this.thumbnailIndex() > 0) {
      this.thumbnailIndex.update((v) => v - 5);
    }
  }
}
