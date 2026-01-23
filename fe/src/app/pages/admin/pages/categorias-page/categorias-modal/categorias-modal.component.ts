import { Component, inject, input, output, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IApiCategoria } from '@models/categoria.model';
import { FormUtils } from '@shared/form-utils';

@Component({
  selector: 'app-categorias-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './categorias-modal.component.html',
})
export class CategoriasModalComponent {
  private fb = inject(FormBuilder);
  formUtils = FormUtils;

  // Si viene data, es edición. Si es null, es creación.
  categoryData = input<IApiCategoria | null>(null);

  close = output<void>();
  save = output<any>(); // Emitirá los valores del form

  formCategory = this.fb.group({
    nombre: [
      '',
      [Validators.required, Validators.pattern(FormUtils.descripcionPattern)],
    ],
    descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
    estado: ['', Validators.required],
  });

  constructor() {
    // Effect: Reacciona cuando cambia el input 'categoryData'
    effect(() => {
      const data = this.categoryData();
      if (data) {
        this.formCategory.patchValue(data);
      } else {
        this.formCategory.reset({ estado: '' });
      }
    });
  }

  onSubmit() {
    if (this.formCategory.valid) {
      this.save.emit(this.formCategory.value);
    }
  }
}
