import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApiAdminService } from '@services/api-admin.service';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/form-utils';
import { ICreateAdmin, UserRole } from '@models/user.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapArrowLeft } from '@ng-icons/bootstrap-icons';
import { NumericInputDirective } from '@shared/numeric-input.directive';

@Component({
  selector: 'app-admins-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIconComponent, NumericInputDirective],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
    }),
  ],
  templateUrl: './admins-form.component.html',
})
export class AdminsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private routeActive = inject(ActivatedRoute);
  private location = inject(Location);
  private adminService = inject(ApiAdminService);
  private alertService = inject(AlertService);

  formUtils = FormUtils;

  // Estados
  isEditMode = signal(false);
  adminId = signal<number | null>(null);

  // Formulario
  formAdmin = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    last_name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    dni: [
      '',
      [
        Validators.required,
        Validators.minLength(7),
        Validators.pattern('^[0-9]*$'),
      ],
    ], // Solo números
    phone: ['', [Validators.pattern('^[0-9]*$')]], // Opcional, solo números
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.pattern(FormUtils.namePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    email: [
      '',
      [Validators.required, Validators.pattern(FormUtils.emailPattern)],
    ],
    // Password: Obligatorio al crear, opcional al editar
    password: ['', [Validators.pattern(FormUtils.passwordPattern)]],

    // Campos de Auditoría (Bloqueados)
    createdAt: [{ value: '', disabled: true }],
    updatedAt: [{ value: '', disabled: true }],
    deletedAt: [{ value: '', disabled: true }],
  });

  ngOnInit() {
    this.checkEditMode();

    // Validación condicional de contraseña
    if (!this.isEditMode()) {
      this.formAdmin.get('password')?.addValidators(Validators.required);
    }
  }

  // Verificar si venimos a Editar
  checkEditMode() {
    const id = this.routeActive.snapshot.paramMap.get('id');
    if (id) {
      this.adminId.set(+id);
      this.isEditMode.set(true);

      this.adminService.getAdminById(+id).subscribe({
        next: (admin) => {
          this.formAdmin.patchValue({
            name: admin.name,
            last_name: admin.last_name,
            dni: admin.dni,
            phone: admin.phone,
            username: admin.username,
            email: admin.email,
            // Fechas (Formateadas o directas ISO)
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
            deletedAt: admin.deletedAt || 'N/A',
          });
          // Al editar, quitamos el required del password si no lo tiene
          this.formAdmin.get('password')?.removeValidators(Validators.required);
          this.formAdmin.get('password')?.updateValueAndValidity();
        },
        error: () => {
          this.alertService.toast('Error al cargar administrador', 'error');
          this.goBack();
        },
      });
    }
  }

  goBack() {
    this.location.back();
  }

  onSubmit() {
    if (this.formAdmin.valid) {
      const formValue = this.formAdmin.getRawValue();

      const adminData: ICreateAdmin = {
        name: formValue.name!,
        last_name: formValue.last_name!,
        dni: formValue.dni!,
        phone: formValue.phone || '',
        username: formValue.username!,
        email: formValue.email!,
        password: formValue.password || '',
        role: UserRole.ADMIN, // Typescript lo pide, pero el backend lo ignora/fuerza.
      };

      // LÓGICA DE LIMPIEZA PARA UPDATE
      // Si estamos editando y el password está vacío, LO QUITAMOS del objeto para evitar que el backend intente procesar un string vacío.
      if (this.isEditMode() && !adminData.password) {
        delete (adminData as any).password;
      }

      let request$;
      if (this.isEditMode() && this.adminId()) {
        request$ = this.adminService.updateAdmin(this.adminId()!, adminData);
      } else {
        request$ = this.adminService.addAdmin(adminData);
      }

      request$.subscribe({
        next: () => {
          this.alertService.toast('Guardado exitosamente', 'success');
          this.router.navigate(['/admin/admins']);
        },
        error: (err) => {
          console.error(err);
          this.alertService.toast('Error al guardar', 'error');
        },
      });
    } else {
      this.formAdmin.markAllAsTouched();
    }
  }
}
