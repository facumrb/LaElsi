import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiAdminService } from '@services/api-services/api-admin.service';
import { AuthService } from '@services/auth.service';
import { ICreateAdmin, UserRole } from '@models/user.model';
import { IApiUserPhoto } from '@models/photo.model';
import { AlertService } from '@services/alert.service';
import { FormUtils } from '@shared/validators/form-utils';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { AuditInfoComponent } from '@admin/components/audit-info/audit-info.component';
import { PhoneInputDirective } from '@shared/directives/phone-input.directive';
import { GoBackButtonComponent } from '@shared/components/buttons/go-back-button/go-back-button.component';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';
import { TrimInputDirective } from '@shared/directives/trim-input.directive';

@Component({
  selector: 'app-admins-form',
  imports: [
    ReactiveFormsModule,
    NumericInputDirective,
    PhoneInputDirective,
    PhotoManagerComponent,
    AuditInfoComponent,
    GoBackButtonComponent,
    FieldErrorComponent,
    RouterLink,
    TrimInputDirective,
  ],
  templateUrl: './admins-form.component.html',
})
export class AdminsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private routeActive = inject(ActivatedRoute);
  private location = inject(Location);
  private adminService = inject(ApiAdminService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);

  photoManager = viewChild.required(PhotoManagerComponent);

  isEditMode = signal(false);
  adminId = signal<number | null>(null);
  currentPhoto = signal<IApiUserPhoto | null>(null);

  // Signal para guardar el estado inicial del formulario
  initialFormValue = signal<string>('');

  // Auditoría (signals de auditoria solo lectura)
  auditCreatedAt = signal<string | null>(null);
  auditUpdatedAt = signal<string | null>(null);
  auditStatusDate = signal<string | null>(null);

  formAdmin = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        FormUtils.minLength(2),
        FormUtils.maxLength(100),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        FormUtils.minLength(2),
        FormUtils.maxLength(100),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    dni: [
      '',
      [
        Validators.required,
        FormUtils.minLength(7),
        FormUtils.maxLength(15),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],
    phone: [
      '',
      [
        Validators.required,
        FormUtils.minLength(7),
        FormUtils.maxLength(20),
        Validators.pattern(FormUtils.phonePattern),
      ],
    ],

    // --- CUENTA DE USUARIO ---
    username: [
      '',
      [
        Validators.required,
        FormUtils.minLength(4),
        FormUtils.maxLength(30),
        Validators.pattern(FormUtils.usernamePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    email: [
      '',
      [
        Validators.required,
        FormUtils.maxLength(255),
        Validators.pattern(FormUtils.emailPattern),
      ],
    ],
    // Password: Obligatorio al crear, opcional al editar
    password: [
      '',
      [FormUtils.maxLength(100), Validators.pattern(FormUtils.passwordPattern)],
    ],
  });

  ngOnInit() {
    this.checkEditMode();
    if (!this.isEditMode()) {
      this.formAdmin.get('password')?.addValidators(Validators.required);
    }
  }

  checkEditMode() {
    const id = this.routeActive.snapshot.paramMap.get('id');
    if (id) {
      this.loadAdminData(+id);
    } else {
      this.setupAsyncValidators();
    }
  }

  private setupAsyncValidators(excludeId?: number) {
    this.formAdmin.controls.dni.setAsyncValidators(
      FormUtils.uniqueFieldValidator('Admin', 'dni', this.http, excludeId),
    );
    this.formAdmin.controls.username.setAsyncValidators(
      FormUtils.uniqueFieldValidator('Admin', 'username', this.http, excludeId),
    );
    this.formAdmin.controls.email.setAsyncValidators(
      FormUtils.uniqueFieldValidator('Admin', 'email', this.http, excludeId),
    );
  }

  loadAdminData(id: number) {
    this.adminId.set(id);
    this.isEditMode.set(true);

    this.adminService.getAdminById(id).subscribe({
      next: (admin) => {
        this.currentPhoto.set(admin.photo);
        this.formAdmin.patchValue({
          name: admin.name,
          lastName: admin.lastName,
          dni: admin.dni,
          phone: admin.phone,
          username: admin.username,
          email: admin.email,
        });

        // Auditoría
        this.auditCreatedAt.set(admin.createdAt);
        this.auditUpdatedAt.set(admin.updatedAt);
        this.auditStatusDate.set(admin.deletedAt || admin.createdAt);

        this.formAdmin.get('password')?.removeValidators(Validators.required);
        this.formAdmin.get('password')?.updateValueAndValidity();

        this.setupAsyncValidators(id);

        const formSnapshot = this.formAdmin.getRawValue();
        this.initialFormValue.set(JSON.stringify(formSnapshot));
      },
      error: () => {
        this.location.back();
      },
    });
  }

  get fullName(): string {
    const name = this.formAdmin.get('name')?.value || '';
    const lastName = this.formAdmin.get('lastName')?.value || '';
    return `${name} ${lastName}`;
  }

  get hasRealChanges(): boolean {
    // Si estamos creando, siempre permitimos guardar (si es válido)
    if (!this.isEditMode()) return true;

    // Comparar formulario actual vs inicial
    const currentJson = JSON.stringify(this.formAdmin.getRawValue());
    const formHasChanges = currentJson !== this.initialFormValue();

    // Verificar cambios en la foto
    const photoHasChanges = this.photoManager().hasChanges();

    return formHasChanges || photoHasChanges;
  }

  onSubmit() {
    if (!this.formAdmin.valid) {
      this.formAdmin.markAllAsTouched();
      return;
    }

    const formValue = this.formAdmin.getRawValue();

    const baseData = {
      name: formValue.name!,
      lastName: formValue.lastName!,
      dni: formValue.dni!,
      phone: formValue.phone!,
      username: formValue.username!,
      email: formValue.email!,
      role: UserRole.Admin,
    };

    const adminData = formValue.password
      ? { ...baseData, password: formValue.password }
      : baseData;

    // Guardar datos del Usuario
    let userRequest$;
    if (this.isEditMode() && this.adminId()) {
      userRequest$ = this.adminService.updateAdmin(
        this.adminId()!,
        adminData as Partial<ICreateAdmin>
      );
    } else {
      userRequest$ = this.adminService.addAdmin(adminData as ICreateAdmin);
    }

    // Una vez guardado el usuario, procesamos la foto
    userRequest$
      .pipe(
        switchMap((res: any) => {
          const userId = this.isEditMode()
            ? this.adminId()!
            : res.id || res.data?.id;

          if (!userId) {
            console.error(
              'No se pudo obtener el ID del usuario para subir la foto',
            );
            return of(null);
          }

          if (this.photoManager().hasChanges()) {
            return this.photoManager().saveChanges(userId);
          }

          return of(null);
        }),
      )
      .subscribe({
        next: (photoResponse: any) => {
          this.alertService.toast('Guardado exitosamente', 'success');
          // --- Logica para actualizar el token en caso de que sea un edit del mismo usuario que esta logeado
          const currentUserId = this.authService.currentUser()?.id;
          const editedId = this.adminId();

          // Si estoy editando MI PROPIO perfil
          if (editedId && editedId === currentUserId) {
            // Preparamos los cambios de texto
            const sessionUpdates: any = {
              name: formValue.name,
              lastName: formValue.lastName,
            };

            // Caso A: Se subió una foto nueva
            if (photoResponse && photoResponse.id) {
              sessionUpdates.photo = photoResponse;
            }
            // Caso B: No hay foto nueva devuelta, PERO se marcó para borrar
            else if (this.photoManager().deletePending()) {
              sessionUpdates.photo = null;
            }

            // Actualizamos el AuthService (y por ende el Navbar)
            this.authService.updateCurrentUser(sessionUpdates);
          }
          this.router.navigate(['/admin/admins']);
        },
      });
  }
}
