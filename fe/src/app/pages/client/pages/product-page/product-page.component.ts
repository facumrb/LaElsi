import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IApiCategory } from '@models/category.model';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ProductStatusBadgeComponent } from '@client/components/product-status-badge/product-status-badge.component';
import {
  BreadcrumbsComponent,
  BreadcrumbStep,
} from '@client/components/breadcrumbs/breadcrumbs.component';
import { AddToCartControlComponent } from '@client/components/add-to-cart-control/add-to-cart-control.component';
import { ProductImageComponent } from '@shared/components/product-image/product-image.component';
import { CarouselNavComponent } from '@client/components/carousel-nav/carousel-nav.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCheckLg,
  bootstrapShieldCheck,
  bootstrapLightningFill,
} from '@ng-icons/bootstrap-icons';
import { injectActiveProductDetailQuery } from '@services/queries/product-queries';

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
    CarouselNavComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapCheckLg,
      bootstrapShieldCheck,
      bootstrapLightningFill,
    }),
  ],
  templateUrl: './product-page.component.html',
})
export class ProductPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  private productId = signal<number>(0);
  selectedPhotoFileName = signal<string | null>(null);
  thumbnailIndex = signal(0);

  // Tier 2: Query Layer
  productQuery = injectActiveProductDetailQuery(this.productId);

  product = computed(() => this.productQuery.data());

  // Breadcrumbs
  breadcrumbSteps = computed<BreadcrumbStep[]>(() => {
    const prod = this.product();
    if (!prod || !prod.category) return [];
    const steps: BreadcrumbStep[] = [];
    const buildPath = (current: IApiCategory) => {
      steps.unshift({ label: current.name, url: `/category/${current.id}` });
      if (current.parent) buildPath(current.parent);
    };
    buildPath(prod.category);
    steps.push({ label: prod.name });
    return steps;
  });

  productPhotos = computed(() => this.product()?.photos || []);

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

    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    // Set the reactive ID — query activates automatically (enabled: id > 0)
    this.productId.set(id);

    // Set initial photo once data loads
    const setInitialPhoto = () => {
      const photos = this.product()?.photos;
      if (photos && photos.length > 0) {
        this.selectedPhotoFileName.set(photos[0].fileName);
      } else {
        this.selectedPhotoFileName.set(null);
      }
    };

    // Use an effect-like approach via the query's success state
    if (this.productQuery.isSuccess()) {
      setInitialPhoto();
    }
  }

  nextPhoto() {
    const photos = this.productPhotos();
    if (!photos.length) return;
    const currentIndex = photos.findIndex((p) => p.fileName === this.selectedPhotoFileName());
    const nextIndex = (currentIndex + 1) % photos.length;
    this.selectedPhotoFileName.set(photos[nextIndex].fileName);
  }

  prevPhoto() {
    const photos = this.productPhotos();
    if (!photos.length) return;
    const currentIndex = photos.findIndex((p) => p.fileName === this.selectedPhotoFileName());
    const prevIndex =
      currentIndex === -1 ? photos.length - 1 : (currentIndex - 1 + photos.length) % photos.length;
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
