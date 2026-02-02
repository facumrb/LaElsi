import {
  Component,
  inject,
  input,
  output,
  effect,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IApiCategory } from '@models/category.model';
import { FormUtils } from '@shared/form-utils';

@Component({
  selector: 'app-categories-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './categories-modal.component.html',
})
export class CategoriesModalComponent {
  private fb = inject(FormBuilder);
  formUtils = FormUtils;

  // Si viene data, es edición. Si es null, es creación.
  categoryData = input<IApiCategory | null>(null);

  close = output<void>();
  save = output<any>();

  formCategory = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(FormUtils.namePattern),
      ],
    ],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    state: ['Activo' as 'Activo' | 'Inactivo', [Validators.required]],
  });

  constructor() {
    // Effect: Reacciona cuando cambia el input 'categoryData'
    effect(() => {
      const data = this.categoryData();
      if (data) {
        this.formCategory.patchValue(data);
      } else {
        this.formCategory.reset({ state: 'Activo' });
      }
    });
  }
  showStateMenu = signal(false);

  toggleStateMenu() {
    this.showStateMenu.set(!this.showStateMenu());
  }

  selectState(state: string) {
    this.formCategory.patchValue({ state: state as 'Activo' | 'Inactivo' });
    this.showStateMenu.set(false);
  }

  onSubmit() {
    if (this.formCategory.valid) {
      this.save.emit(this.formCategory.value);
    }
  }
}
