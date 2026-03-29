import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoBackButtonComponent } from '@shared/components/buttons/go-back-button/go-back-button.component';
import { ApiCategoryService } from '@services/api-category.service';
import {
  ICreateCategory,
  CategoryState,
  IApiCategory,
} from '@models/category.model';
import { ProductDraftService } from '@services/product-draft.service';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/validators/form-utils';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { AuditInfoComponent } from '@shared/components/audit-info/audit-info.component';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';
import { TrimInputDirective } from '@shared/directives/trim-input.directive';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';

@Component({
  selector: 'app-categories-form',
  imports: [
    ReactiveFormsModule,
    ClickOutsideDirective,
    NumericInputDirective,
    TrimInputDirective,
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
  private http = inject(HttpClient);

  formUtils = FormUtils;

  // Estados
  isEditMode = signal(false);
  categoryId = signal<number | null>(null);
  initialFormValue = signal<string>(''); // Para hasRealChanges
  initialState = signal<string>('Activo'); // Para AuditInfoComponent

  // Auditoría (signals de auditoria solo lectura)
  auditCreatedAt = signal<string | null>(null);
  auditUpdatedAt = signal<string | null>(null);
  auditStatusDate = signal<string | null>(null);

  categoriesCount = signal<number>(0);
  allCategories = signal<IApiCategory[]>([]);

  // UI State
  showStateMenu = signal(false);
  showParentMenu = signal(false);

  formCategory = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        FormUtils.minLength(3),
        FormUtils.maxLength(50),
        Validators.pattern(FormUtils.namePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    description: ['', [FormUtils.maxLength(1000), FormUtils.notOnlyWhiteSpace]],
    state: [CategoryState.Activo, [Validators.required]],
    parentId: [null as number | null],
    order: [
      1,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(1), // Se actualiza dinámicamente por el effect()
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],
  });

  // Seguimiento reactivo del parentId del formulario
  // initialValue: null asegura que en el estado inicial (sin emisiones aún) el valor sea null (raíz)
  currentParentId = toSignal(
    this.formCategory.get('parentId')!.valueChanges.pipe(takeUntilDestroyed()),
    { initialValue: null as number | null },
  );

  maxOrder = computed(() => {
    const parentId = this.currentParentId();
    // Peers: solo las categorías del mismo nivel (mismo parentId)
    const peers = this.allCategories().filter((c) => {
      const cParent = c.parentId ?? null;
      return cParent === parentId;
    });

    const count = peers.length;

    if (this.isEditMode()) {
      // Si ya pertenece a este padre, no sumamos 1 (solo ocupa uno de los N lugares)
      const editedCat = this.allCategories().find(
        (c) => c.id === this.categoryId(),
      );
      const isSameParent = (editedCat?.parentId ?? null) === parentId;
      return isSameParent ? count : count + 1;
    }

    return count + 1;
  });

  // Actualiza Validators.max dinámicamente cuando cambia maxOrder
  private maxOrderEffect = effect(() => {
    const max = this.maxOrder();
    const orderControl = this.formCategory.controls.order;
    orderControl.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(max),
      Validators.pattern(FormUtils.numberPattern),
    ]);
    orderControl.updateValueAndValidity();
  });

  // Computada para categorías que pueden ser padres
  eligibleParents = computed(() => {
    const currentId = this.categoryId();
    const categories = this.allCategories();

    if (!currentId) return categories;

    // Función recursiva para obtener todos los descendientes
    const getDescendantIds = (catId: number): number[] => {
      const children = categories.filter((c) => (c.parentId || null) === catId);
      let ids = children.map((c) => c.id);
      children.forEach((c) => {
        ids = [...ids, ...getDescendantIds(c.id)];
      });
      return ids;
    };

    const descendants = getDescendantIds(currentId);
    return categories.filter(
      (c) => c.id !== currentId && !descendants.includes(c.id),
    );
  });

  // Nombre del padre seleccionado
  parentName = computed(() => {
    const parentId = this.currentParentId();
    if (!parentId) return 'Ninguna (Categoría Raíz)';
    const parent = this.allCategories().find((c) => c.id === parentId);
    return parent ? parent.name : 'Ninguna (Categoría Raíz)';
  });

  ngOnInit() {
    this.checkEditMode();
    this.loadAllCategories();
  }

  loadAllCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.allCategories.set(categories);
        this.categoriesCount.set(categories.length);
      },
    });
  }

  checkEditMode() {
    const id = this.routeActive.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(+id);
      this.isEditMode.set(true);
      this.loadCategory(+id);
    } else {
      // Validación async para creación
      this.formCategory.controls.name.addAsyncValidators(
        FormUtils.uniqueFieldValidator('Category', 'name', this.http),
      );
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
          parentId: category.parentId ?? category.parent?.id ?? null,
          order: category.order || 1,
        });

        // Auditoría → signals reactivos
        this.auditCreatedAt.set(
          this.datePipe.transform(category.createdAt, dateFormat),
        );
        this.auditUpdatedAt.set(
          this.datePipe.transform(category.updatedAt, dateFormat),
        );
        this.auditStatusDate.set(
          category.deletedAt
            ? this.datePipe.transform(category.deletedAt, dateFormat)
            : this.datePipe.transform(category.createdAt, dateFormat),
        );

        this.initialState.set(category.state);

        // Snapshot para comparación
        const formSnapshot = this.formCategory.getRawValue();
        this.initialFormValue.set(JSON.stringify(formSnapshot));

        // Validación async para edición
        this.formCategory.controls.name.setAsyncValidators(
          FormUtils.uniqueFieldValidator('Category', 'name', this.http, id),
        );
      },
      error: () => {
        this.alertService.toast('Error al cargar la categoría', 'error');
        this.location.back();
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

  toggleParentMenu() {
    this.showParentMenu.update((v) => !v);
  }

  selectParent(id: number | null) {
    this.formCategory.patchValue({ parentId: id });
    this.showParentMenu.set(false);
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
      parentId: formValue.parentId || null,
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
