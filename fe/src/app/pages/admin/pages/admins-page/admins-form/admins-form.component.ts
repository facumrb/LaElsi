import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiAdminService } from '@services/api-admin.service';
import { AuthService } from '@services/auth.service';
import { ICreateAdmin, UserRole } from '@models/user.model';
import { IApiUserPhoto } from '@models/photo.model';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/validators/form-utils';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { AuditInfoComponent } from '@shared/components/audit-info/audit-info.component';
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
  providers: [DatePipe],
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
  private datePipe = inject(DatePipe);
  private http = inject(HttpClient);

  formUtils = FormUtils;

  @ViewChild(PhotoManagerComponent) photoManager!: PhotoManagerComponent;

  isEditMode = signal(false);
  adminId = signal<number | null>(null);
  currentPhoto = signal<IApiUserPhoto | null>(null);

  // Signal para guardar el estado inicial del formulario
  initialFormValue = signal<string>('');

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
      [
        FormUtils.maxLength(100),
        Validators.pattern(FormUtils.passwordPattern),
      ],
    ],

    // Campos de Auditoría (Bloqueados)
    createdAt: [{ value: '', disabled: true }],
    updatedAt: [{ value: '', disabled: true }],
    deletedAt: [{ value: '', disabled: true }],
  });

  get formPending() {
    return this.formAdmin.pending;
  }

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
      // Configurar validadores asíncronos para creación
      this.formAdmin.controls.dni.addAsyncValidators(
        FormUtils.uniqueFieldValidator('Admin', 'dni', this.http),
      );
      this.formAdmin.controls.username.addAsyncValidators(
        FormUtils.uniqueFieldValidator('Admin', 'username', this.http),
      );
      this.formAdmin.controls.email.addAsyncValidators(
        FormUtils.uniqueFieldValidator('Admin', 'email', this.http),
      );
      this.formAdmin.get('password')?.addValidators(Validators.required);
    }
  }

  loadAdminData(id: number) {
    this.adminId.set(id);
    this.isEditMode.set(true);

    this.adminService.getAdminById(id).subscribe({
      next: (admin) => {
        this.currentPhoto.set(admin.photo);
        const dateFormat = 'dd/MM/yyyy HH:mm';

        this.formAdmin.patchValue({
          name: admin.name,
          lastName: admin.lastName,
          dni: admin.dni,
          phone: admin.phone,
          username: admin.username,
          email: admin.email,
          createdAt: this.datePipe.transform(admin.createdAt, dateFormat),
          updatedAt: this.datePipe.transform(admin.updatedAt, dateFormat),
          deletedAt: admin.deletedAt
            ? this.datePipe.transform(admin.deletedAt, dateFormat)
            : this.datePipe.transform(admin.createdAt, dateFormat),
        });

        this.formAdmin.get('password')?.removeValidators(Validators.required);
        this.formAdmin.get('password')?.updateValueAndValidity();

        // Configurar validadores asíncronos para edición
        this.formAdmin.controls.dni.setAsyncValidators(
          FormUtils.uniqueFieldValidator('Admin', 'dni', this.http, id),
        );
        this.formAdmin.controls.username.setAsyncValidators(
          FormUtils.uniqueFieldValidator('Admin', 'username', this.http, id),
        );
        this.formAdmin.controls.email.setAsyncValidators(
          FormUtils.uniqueFieldValidator('Admin', 'email', this.http, id),
        );

        const formSnapshot = this.formAdmin.getRawValue();
        this.initialFormValue.set(JSON.stringify(formSnapshot));
      },
      error: () => {
        this.alertService.toast('Error al cargar administrador', 'error');
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
    const photoHasChanges = this.photoManager?.hasChanges() ?? false;

    return formHasChanges || photoHasChanges;
  }

  onSubmit() {
    if (this.formAdmin.invalid) {
      this.formAdmin.markAllAsTouched();
      return;
    }

    const formValue = this.formAdmin.getRawValue();

    const adminData: ICreateAdmin = {
      name: formValue.name!,
      lastName: formValue.lastName!,
      dni: formValue.dni!,
      phone: formValue.phone!,
      username: formValue.username!,
      email: formValue.email!,
      password: formValue.password || '',
      role: UserRole.Admin,
    };

    if (this.isEditMode() && !adminData.password) {
      delete (adminData as any).password;
    }

    // Guardar datos del Usuario
    let userRequest$;
    if (this.isEditMode() && this.adminId()) {
      userRequest$ = this.adminService.updateAdmin(this.adminId()!, adminData);
    } else {
      userRequest$ = this.adminService.addAdmin(adminData);
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
            return [];
          }

          // Llamamos al método público del hijo
          return this.photoManager.saveChanges(userId);
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
            else if (this.photoManager.deletePending()) {
              sessionUpdates.photo = null;
            }

            // Actualizamos el AuthService (y por ende el Navbar)
            this.authService.updateCurrentUser(sessionUpdates);
          }
          this.router.navigate(['/admin/admins']);
        },
        error: (err) => {
          console.error(err);
          this.alertService.toast('Error al guardar (revise la foto)', 'error');
        },
      });
  }
}
