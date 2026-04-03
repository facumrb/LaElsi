import { Component, input, effect, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IApiCategory } from '@models/category.model';
import { FormUtils } from '@shared/validators/form-utils';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';

@Component({
  selector: 'app-category-order-input',
  imports: [ReactiveFormsModule, FieldErrorComponent, NumericInputDirective],
  templateUrl: './category-order-input.component.html',
})
export class CategoryOrderInputComponent {
  control = input.required<FormControl<number | null>>();
  categories = input.required<IApiCategory[]>();
  currentParentId = input<number | null>(null);
  isEditMode = input<boolean>(false);
  categoryId = input<number | null>(null);

  maxOrder = computed(() => {
    const parentId = this.currentParentId();
    // Peers: solo las categorías del mismo nivel (mismo parentId)
    const peers = this.categories().filter((c) => {
      const cParent = c.parentId ?? c.parent?.id ?? null;
      return cParent === parentId;
    });

    const count = peers.length;

    if (this.isEditMode()) {
      // Si ya pertenece a este padre, no sumamos 1 (solo ocupa uno de los N lugares)
      const editedCat = this.categories().find(
        (c) => c.id === this.categoryId(),
      );
      const isSameParent = (editedCat?.parentId ?? editedCat?.parent?.id ?? null) === parentId;
      return isSameParent ? count : count + 1;
    }

    return count + 1;
  });

  constructor() {
    effect(() => {
      const max = this.maxOrder();
      const orderControl = this.control();
      if (!orderControl) return;

      orderControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(max),
        Validators.pattern(FormUtils.numberPattern),
      ]);
      orderControl.updateValueAndValidity();
    });
  }
}
