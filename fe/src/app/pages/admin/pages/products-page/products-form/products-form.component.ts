import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoBackButtonComponent } from '@shared/components/buttons/go-back-button/go-back-button.component';
import { ApiCategoryService } from '@services/api-category.service';
import { IApiCategory } from '@models/category.model';
import { ProductDraftService } from '@services/product-draft.service';
import { FormUtils } from '@shared/validators/form-utils';
import { ApiProductService } from '@services/api-product.service';
import { AlertService } from '@shared/alert.service';
import { ICreateProduct, ProductState } from '@models/product.model';
import { PhotoManagerComponent } from './photo-manager/photo-manager.component';
import { IApiProductPhoto } from '@models/photo.model';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronDown,
  bootstrapCheckLg,
  bootstrapPlusLg,
} from '@ng-icons/bootstrap-icons';
import { AuditInfoComponent } from '@shared/components/audit-info/audit-info.component';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';

@Component({
  selector: 'app-products-form',
  imports: [
    ReactiveFormsModule,
    NumericInputDirective,
    ClickOutsideDirective,
    PhotoManagerComponent,
    NgIconComponent,
    AuditInfoComponent,
    GoBackButtonComponent,
    FieldErrorComponent,
    RouterLink,
  ],
  viewProviders: [
    provideIcons({
      bootstrapChevronDown,
      bootstrapCheckLg,
      bootstrapPlusLg,
    }),
  ],
  providers: [DatePipe],
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
  private datePipe = inject(DatePipe);
  private draftService = inject(ProductDraftService);
  private http = inject(HttpClient);

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

  // Señal para guardar el estado inicial del formulario
  initialFormValue = signal<string>('');
  initialState = signal<string>('Activo');

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
    totalSold: [
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
    state: [ProductState.Activo, [Validators.required]],
    category: [null as IApiCategory | null, [Validators.required]],
    photos: [[]], // array vacío por defecto por si no se cargan fotos

    // --- AUDITORÍA ---
    createdAt: [{ value: '', disabled: true }],
    updatedAt: [{ value: '', disabled: true }],
    deletedAt: [{ value: '', disabled: true }],
  });

  ngOnInit() {
    this.loadCategories();
    this.checkEditMode();
    this.restoreDraftIfAny();
  }

  restoreDraftIfAny() {
    if (this.draftService.hasDraft()) {
      const draft = this.draftService.getDraft()!;
      this.isEditMode.set(draft.isEditMode);
      this.productId.set(draft.productId);

      const { photos, ...formValueWithoutPhotos } = draft.formValue;
      this.formProduct.patchValue(formValueWithoutPhotos);

      // Restaurar fotos después de que el componente hijo esté disponible
      setTimeout(() => {
        if (this.photoManager) {
          this.photoManager.restoreState({
            gallery: draft.photos as any[],
            photosToDeleteIds: draft.photosToDeleteIds,
          });
        }
      }, 0);

      this.draftService.clearDraft();
    }
  }

  // 1. Cargar categorías para el desplegable
  loadCategories() {
    this.categoryService.getAllCategories().subscribe((data) => {
      this.categories.set(data);

      // Verificamos si hay una nueva categoría para seleccionar automáticamente
      const newCatId =
        this.routeActive.snapshot.queryParamMap.get('newCategoryId');
      if (newCatId) {
        const cat = data.find((c) => c.id === +newCatId);
        if (cat) {
          this.formProduct.patchValue({ category: cat });
          this.alertService.toast(
            `Categoría "${cat.name}" seleccionada`,
            'success',
          );
        }
        // Limpiar el query param para que no se seleccione de nuevo al recargar
        this.router.navigate([], {
          queryParams: { newCategoryId: null },
          queryParamsHandling: 'merge',
        });
      }
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
          const dateFormat = 'dd/MM/yyyy HH:mm';

          this.formProduct.patchValue({
            name: product.name,
            description: product.description,
            price: currentPrice ? currentPrice.amount : null,
            brand: product.brand,
            stock: product.stock,
            state: product.state,
            totalSold: product.totalSold,
            category: product.category,
            createdAt: this.datePipe.transform(product.createdAt, dateFormat),
            updatedAt: this.datePipe.transform(product.updatedAt, dateFormat),
            deletedAt: product.deletedAt
              ? this.datePipe.transform(product.deletedAt, dateFormat)
              : this.datePipe.transform(product.createdAt, dateFormat),
          });

          const formSnapshot = this.formProduct.getRawValue();

          this.initialFormValue.set(JSON.stringify(formSnapshot));
          this.initialState.set(product.state);

          // Validación async para edición
          this.formProduct.controls.name.setAsyncValidators(
            FormUtils.uniqueFieldValidator('Product', 'name', this.http, +id),
          );

          // PASAMOS LAS FOTOS AL HIJO
          if (product.photos) {
            this.initialPhotos.set(product.photos);
          }
        },
        error: () => {
          this.alertService.toast('Error al cargar', 'error');
          this.location.back();
        },
      });
    } else {
      // Validación async para creación
      this.formProduct.controls.name.addAsyncValidators(
        FormUtils.uniqueFieldValidator('Product', 'name', this.http),
      );
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
    this.formProduct.patchValue({ state: state as ProductState });
    this.showStateMenu.set(false);
  }

  goToCreateCategory() {
    // Guardar borrador
    const photoState = this.photoManager.getCurrentState();
    this.draftService.setDraft({
      formValue: this.formProduct.getRawValue(),
      isEditMode: this.isEditMode(),
      productId: this.productId(),
      photos: photoState.gallery,
      photosToDeleteIds: photoState.photosToDeleteIds,
      returnUrl: this.router.url,
    });

    // Navegar con query param para saber que venimos de producto
    this.router.navigate(['/admin/categories/create'], {
      queryParams: { fromProduct: 'true' },
    });
  }

  get hasRealChanges(): boolean {
    if (!this.isEditMode()) return true;

    // Comparamos el JSON actual completo contra el inicial
    const currentJson = JSON.stringify(this.formProduct.getRawValue());
    const formHasChanges = currentJson !== this.initialFormValue();

    // Verificar fotos
    const photosHaveChanges = this.photoManager?.hasChanges() ?? false;

    return formHasChanges || photosHaveChanges;
  }

  onSubmit() {
    if (this.formProduct.valid) {
      const formValue = this.formProduct.getRawValue();

      if (!formValue.category || !formValue.category.id) {
        this.alertService.toast(
          'Debe seleccionar una categoría válida',
          'error',
        );
        return;
      }

      const productJson: ICreateProduct = {
        name: formValue.name!,
        description: formValue.description!,
        brand: formValue.brand!,
        totalSold: Number(formValue.totalSold),
        price: Number(formValue.price),
        stock: Number(formValue.stock),
        state: formValue.state!,
        category: formValue.category.id,
      };

      // GUARDAR/ACTUALIZAR PRODUCTO (PADRE)
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

          // DELEGAR FOTOS AL HIJO
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
