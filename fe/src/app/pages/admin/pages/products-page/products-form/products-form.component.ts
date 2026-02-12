import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApiCategoryService } from '@services/api-category.service';
import { IApiCategory } from '@models/category.model';
import { FormUtils } from '@shared/form-utils';
import { ApiProductService } from '@services/api-product.service';
import { AlertService } from '@shared/alert.service';
import { ICreateProduct } from '@models/product.model';
import { PhotoManagerComponent } from './photo-manager/photo-manager.component';
import { IApiProductPhoto } from '@models/photo.model';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowLeft,
  bootstrapChevronDown,
  bootstrapCheck,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-products-form',
  imports: [
    ReactiveFormsModule,
    NumericInputDirective,
    ClickOutsideDirective,
    PhotoManagerComponent,
    NgIconComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
      bootstrapChevronDown,
      bootstrapCheck,
    }),
  ],
  templateUrl: './products-form.component.html',
})
export class ProductsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private routeActive = inject(ActivatedRoute);
  private location = inject(Location);
  private categoryService = inject(ApiCategoryService);
  private productService = inject(ApiProductService);
  private alertService = inject(AlertService);

  formUtils = FormUtils;

  // Acceso al hijo para llamar a su método de guardar
  @ViewChild(PhotoManagerComponent)
  photoManager!: PhotoManagerComponent;

  // Fotos iniciales para pasar al hijo
  initialPhotos = signal<IApiProductPhoto[]>([]);

  // Estados
  categories = signal<IApiCategory[]>([]);
  isEditMode = signal(false);
  productId = signal<number | null>(null);

  // Formulario
  formProduct = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(FormUtils.namePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.maxLength(1000),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    price: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],
    brand: ['', [Validators.required, FormUtils.notOnlyWhiteSpace]],
    total_sold: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],
    stock: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],
    state: ['Activo' as 'Activo' | 'Inactivo', [Validators.required]],
    category: [null as IApiCategory | null, [Validators.required]],
    photos: [[]], // array vacío por defecto por si no se cargan fotos
  });

  ngOnInit() {
    this.loadCategories();
    this.checkEditMode();
  }

  // 1. Cargar categorías para el desplegable
  loadCategories() {
    this.categoryService.getAllCategories().subscribe((data) => {
      this.categories.set(data);
    });
  }

  // 2. Verificar si venimos a Editar (por URL)
  checkEditMode() {
    const id = this.routeActive.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.isEditMode.set(true);

      this.productService.getProductById(+id).subscribe({
        next: (product) => {
          const currentPrice = product.prices?.find((p) => p.isCurrent);
          this.formProduct.patchValue({
            name: product.name,
            description: product.description,
            price: currentPrice ? currentPrice.amount : null,
            brand: product.brand,
            stock: product.stock,
            state: product.state,
            total_sold: product.total_sold,
            category: product.category,
          });

          // PASAMOS LAS FOTOS AL HIJO
          if (product.photos) {
            this.initialPhotos.set(product.photos);
          }
        },
        error: () => {
          this.alertService.toast('Error al cargar', 'error');
          this.goBack();
        },
      });
    }
  }

  // UI States
  showCategoryMenu = signal(false);
  showStateMenu = signal(false);

  // --- Lógica de Menús de acordeon ---
  toggleCategoryMenu() {
    this.showCategoryMenu.update((v) => !v);
    this.showStateMenu.set(false);
  }
  selectCategory(c: IApiCategory) {
    this.formProduct.patchValue({ category: c });
    this.showCategoryMenu.set(false);
  }
  toggleStateMenu() {
    this.showStateMenu.update((v) => !v);
    this.showCategoryMenu.set(false);
  }
  selectState(state: string) {
    this.formProduct.patchValue({ state: state as 'Activo' | 'Inactivo' });
    this.showStateMenu.set(false);
  }

  goBack() {
    this.location.back();
  }

  onSubmit() {
    if (this.formProduct.valid) {
      const formValue = this.formProduct.getRawValue();

      const productJson: ICreateProduct = {
        name: formValue.name ?? '',
        description: formValue.description ?? '',
        brand: formValue.brand ?? '',
        total_sold: Number(formValue.total_sold),
        price: Number(formValue.price),
        stock: Number(formValue.stock),
        state: formValue.state ?? 'Activo',
        categoryId: formValue.category?.id ?? 0,
      };

      // 1. GUARDAR/ACTUALIZAR PRODUCTO (PADRE)
      let productObs;
      if (this.isEditMode() && this.productId()) {
        productObs = this.productService.updateProduct(
          this.productId()!,
          productJson,
        );
      } else {
        productObs = this.productService.addProduct(productJson);
      }

      productObs.subscribe({
        next: (responseProduct) => {
          const finalId = this.isEditMode()
            ? this.productId()!
            : responseProduct.id;

          // 2. DELEGAR FOTOS AL HIJO
          this.photoManager.saveChanges(finalId).subscribe({
            next: () => {
              this.alertService.toast('Guardado exitosamente', 'success');
              this.router.navigate(['/admin/products']);
            },
            error: (err) => {
              console.error(err);
              this.alertService.toast(
                'Producto guardado, pero error en fotos',
                'warning',
              );
              this.router.navigate(['/admin/products']);
            },
          });
        },
        error: () =>
          this.alertService.toast('Error al guardar producto', 'error'),
      });
    } else {
      this.formProduct.markAllAsTouched();
    }
  }
}
