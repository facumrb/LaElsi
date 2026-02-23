import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, DatePipe } from '@angular/common';
import { ApiCategoryService } from '@services/api-category.service';
import {
  ICreateCategory,
  CategoryState,
  IApiCategory,
} from '@models/category.model';
import { ProductDraftService } from '@services/product-draft.service';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/form-utils';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowLeft,
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { AuditInfoComponent } from '@shared/components/audit-info/audit-info.component';

@Component({
  selector: 'app-categories-form',
  imports: [
    ReactiveFormsModule,
    ClickOutsideDirective,
    NgIconComponent,
    AuditInfoComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
      bootstrapChevronDown,
      bootstrapCheckLg,
    }),
  ],
  providers: [DatePipe],
  templateUrl: './categories-form.component.html',
})
export class CategoriesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private routeActive = inject(ActivatedRoute);
  private location = inject(Location);
  private categoryService = inject(ApiCategoryService);
  private alertService = inject(AlertService);
  private datePipe = inject(DatePipe);
  private draftService = inject(ProductDraftService);

  formUtils = FormUtils;

  // Estados
  isEditMode = signal(false);
  categoryId = signal<number | null>(null);
  initialFormValue = signal<string>(''); // Para hasRealChanges

  categoriesCount = signal<number>(0);
  maxOrder = computed(() =>
    this.isEditMode()
      ? Math.max(0, this.categoriesCount() - 1)
      : this.categoriesCount(),
  );

  // UI State
  showStateMenu = signal(false);

  formCategory = this.fb.group({
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
      [Validators.maxLength(1000), FormUtils.notOnlyWhiteSpace],
    ],
    state: [CategoryState.Activo, [Validators.required]],
    order: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],

    // CAMPOS AUDITORÍA
    createdAt: [{ value: '', disabled: true }],
    updatedAt: [{ value: '', disabled: true }],
    deletedAt: [{ value: '', disabled: true }],
  });

  ngOnInit() {
    this.checkEditMode();
    this.loadCategoriesCount();
  }

  loadCategoriesCount() {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categoriesCount.set(categories.length);

        const orderControl = this.formCategory.get('order');
        orderControl?.setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(this.maxOrder()),
          Validators.pattern(FormUtils.numberPattern),
        ]);
        orderControl?.updateValueAndValidity();
      },
    });
  }

  checkEditMode() {
    const id = this.routeActive.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(+id);
      this.isEditMode.set(true);
      this.loadCategory(+id);
    }
  }

  loadCategory(id: number) {
    this.categoryService.getCategoryById(id).subscribe({
      next: (category) => {
        const dateFormat = 'dd/MM/yyyy HH:mm';

        this.formCategory.patchValue({
          name: category.name,
          description: category.description || '',
          state: category.state,
          order: category.order || 0,
          createdAt: this.datePipe.transform(category.createdAt, dateFormat),
          updatedAt: this.datePipe.transform(category.updatedAt, dateFormat),
          deletedAt: category.deletedAt
            ? this.datePipe.transform(category.deletedAt, dateFormat)
            : 'No eliminado',
        });

        // Snapshot para comparación
        const formSnapshot = this.formCategory.getRawValue();
        this.initialFormValue.set(JSON.stringify(formSnapshot));
      },
      error: () => {
        this.alertService.toast('Error al cargar la categoría', 'error');
        this.goBack();
      },
    });
  }

  // Lógica de "Cambios Reales"
  get hasRealChanges(): boolean {
    if (!this.isEditMode()) return true;
    const currentJson = JSON.stringify(this.formCategory.getRawValue());
    return currentJson !== this.initialFormValue();
  }

  // UI Methods
  toggleStateMenu() {
    this.showStateMenu.update((v) => !v);
  }

  selectState(state: string) {
    this.formCategory.patchValue({ state: state as CategoryState });
    this.showStateMenu.set(false);
  }

  goBack() {
    this.location.back();
  }

  onSubmit() {
    if (this.formCategory.invalid) {
      this.formCategory.markAllAsTouched();
      return;
    }

    const formValue = this.formCategory.getRawValue();
    const categoryData: ICreateCategory = {
      name: formValue.name!,
      description: formValue.description || null,
      state: formValue.state!,
      order: Number(formValue.order) || 0,
    };

    let request$;
    if (this.isEditMode() && this.categoryId()) {
      request$ = this.categoryService.updateCategory(
        this.categoryId()!,
        categoryData,
      );
    } else {
      request$ = this.categoryService.addCategory(categoryData);
    }

    request$.subscribe({
      next: (response: IApiCategory) => {
        this.alertService.toast(
          this.isEditMode() ? 'Categoría actualizada' : 'Categoría creada',
          'success',
        );

        // Si venimos de la creación de producto, volvemos allí usando la returnUrl
        const fromProduct =
          this.routeActive.snapshot.queryParamMap.get('fromProduct');
        const draft = this.draftService.getDraft();

        if (fromProduct === 'true' && draft && !this.isEditMode()) {
          this.router.navigateByUrl(
            `${draft.returnUrl}?newCategoryId=${response.id}`,
          );
          return;
        }

        this.router.navigate(['/admin/categories']);
      },
      error: (err) => {
        console.error(err);
        this.alertService.toast('Error al guardar', 'error');
      },
    });
  }
}
