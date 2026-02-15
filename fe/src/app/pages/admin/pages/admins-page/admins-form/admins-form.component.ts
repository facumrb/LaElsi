import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { switchMap } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapArrowLeft } from '@ng-icons/bootstrap-icons';
import { ApiAdminService } from '@services/api-admin.service';
import { AuthService } from '@services/auth.service';
import { ICreateAdmin, UserRole } from '@models/user.model';
import { IApiUserPhoto } from '@models/photo.model';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/form-utils';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { AuditInfoComponent } from '@shared/components/audit-info/audit-info.component';
import { PhoneInputDirective } from '@shared/directives/phone-input.directive';

@Component({
  selector: 'app-admins-form',
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    NumericInputDirective,
    PhoneInputDirective,
    PhotoManagerComponent,
    AuditInfoComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
    }),
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

  formUtils = FormUtils;

  @ViewChild(PhotoManagerComponent) photoManager!: PhotoManagerComponent;

  isEditMode = signal(false);
  adminId = signal<number | null>(null);
  currentPhoto = signal<IApiUserPhoto | null>(null);

  formAdmin = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    dni: [
      '',
      [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(15),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],
    phone: [
      '',
      [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(20),
        Validators.pattern(FormUtils.phonePattern),
      ],
    ],

    // --- CUENTA DE USUARIO ---
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(FormUtils.usernamePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    email: [
      '',
      [
        Validators.required,
        Validators.maxLength(255),
        Validators.pattern(FormUtils.emailPattern),
      ],
    ],
    // Password: Obligatorio al crear, opcional al editar
    password: [
      '',
      [
        Validators.maxLength(100),
        Validators.pattern(FormUtils.passwordPattern),
      ],
    ],

    // Campos de Auditoría (Bloqueados)
    createdAt: [{ value: '', disabled: true }],
    updatedAt: [{ value: '', disabled: true }],
    deletedAt: [{ value: '', disabled: true }],
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
            : 'No eliminado',
        });

        this.formAdmin.get('password')?.removeValidators(Validators.required);
        this.formAdmin.get('password')?.updateValueAndValidity();
      },
      error: () => {
        this.alertService.toast('Error al cargar administrador', 'error');
        this.goBack();
      },
    });
  }

  get fullName(): string {
    const name = this.formAdmin.get('name')?.value || '';
    const lastName = this.formAdmin.get('lastName')?.value || '';
    return `${name} ${lastName}`;
  }

  goBack() {
    this.location.back();
  }

  get hasUnsavedChanges(): boolean {
    // Si estamos CREANDO, siempre hay "cambios"
    if (!this.isEditMode()) return true;

    // Si estamos EDITANDO:
    // ¿El usuario tocó algún input de texto?
    const textChanges = this.formAdmin.dirty;

    // ¿El usuario tocó la foto?
    const photoChanges = this.photoManager
      ? this.photoManager.hasChanges()
      : false;

    return textChanges || photoChanges;
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

            if (photoResponse && photoResponse.photo) {
              sessionUpdates.photo = photoResponse.photo;
            } else if (this.photoManager.deletePending()) {
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
