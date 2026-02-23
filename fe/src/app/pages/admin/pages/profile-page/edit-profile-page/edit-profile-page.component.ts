import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAdminService } from '@services/api-admin.service';
import { IApiAdmin, ICreateAdmin, UserRole } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { FormUtils } from '@shared/form-utils';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { PhoneInputDirective } from '@shared/directives/phone-input.directive';
import { switchMap } from 'rxjs';
import { IApiUserPhoto } from '@models/photo.model';
import { HttpClient } from '@angular/common/http';
import { bootstrapArrowLeft, bootstrapSave, bootstrapArrowClockwise, bootstrapCheckCircleFill, bootstrapXCircleFill } from '@ng-icons/bootstrap-icons';
import { uniqueFieldValidator } from '@shared/validators/unique.validator';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    PhotoManagerComponent,
    NumericInputDirective,
    PhoneInputDirective,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
      bootstrapSave,
      bootstrapArrowClockwise,
      bootstrapCheckCircleFill,
      bootstrapXCircleFill,
    }),
  ],
  templateUrl: './edit-profile-page.component.html',
})
export class EditProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _apiService = inject(ApiAdminService);
  private _authService = inject(AuthService);
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _http = inject(HttpClient);

  @ViewChild(PhotoManagerComponent) photoManager!: PhotoManagerComponent;

  formUtils = FormUtils;
  loading = signal(true);
  adminId = signal<number | null>(null);
  currentPhoto = signal<IApiUserPhoto | null>(null);
  initialFormValue = signal<string>('');

  formEditProfile = this.fb.group({
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
    phone: [
      '',
      [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(20),
        Validators.pattern(FormUtils.phonePattern),
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
  });

  isPending(field: string) {
    return this.formEditProfile.get(field)?.pending;
  }

  isValid(field: string) {
    const control = this.formEditProfile.get(field);
    return control?.valid && control?.value && !control.pristine;
  }

  get formPending() {
    return this.formEditProfile.pending;
  }

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchAdmin(+id);
    }
  }

  private fetchAdmin(id: number): void {
    this.adminId.set(id);
    this._apiService.getAdminById(id).subscribe({
      next: (data: IApiAdmin) => {
        this.currentPhoto.set(data.photo);
        this.formEditProfile.patchValue({
          name: data.name,
          lastName: data.lastName,
          phone: data.phone,
          dni: data.dni,
          username: data.username,
          email: data.email,
        });

        // Configurar validadores asíncronos para edición
        this.formEditProfile.controls.dni.setAsyncValidators(uniqueFieldValidator('Admin', 'dni', this._http, id));
        this.formEditProfile.controls.username.setAsyncValidators(uniqueFieldValidator('Admin', 'username', this._http, id));
        this.formEditProfile.controls.email.setAsyncValidators(uniqueFieldValidator('Admin', 'email', this._http, id));

        this.initialFormValue.set(JSON.stringify(this.formEditProfile.getRawValue()));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this._errorService.handle(err, 'cargar el perfil');
        this.goBack();
      },
    });
  }

  get hasRealChanges(): boolean {
    const currentJson = JSON.stringify(this.formEditProfile.getRawValue());
    const formHasChanges = currentJson !== this.initialFormValue();
    const photoHasChanges = this.photoManager?.hasChanges() ?? false;
    return formHasChanges || photoHasChanges;
  }

  onSubmit(): void {
    if (this.formEditProfile.invalid) {
      this.formEditProfile.markAllAsTouched();
      return;
    }

    const formValue = this.formEditProfile.getRawValue();
    const adminData: ICreateAdmin = {
      name: formValue.name!,
      lastName: formValue.lastName!,
      dni: formValue.dni!,
      phone: formValue.phone!,
      username: formValue.username!,
      email: formValue.email!,
      role: UserRole.Admin,
      password: '', // We don't change password here
    };

    // We don't want to send an empty password to the update
    delete (adminData as any).password;

    this._apiService.updateAdmin(this.adminId()!, adminData)
      .pipe(
        switchMap((res: any) => {
          return this.photoManager.saveChanges(this.adminId()!);
        })
      )
      .subscribe({
        next: (photoResponse: any) => {
          this._alertService.toast('Perfil actualizado con éxito', 'success');

          // Sync with Local Session
          const currentUserId = this._authService.currentUser()?.id;
          if (this.adminId() === currentUserId) {
            const sessionUpdates: any = {
              name: formValue.name,
              lastName: formValue.lastName,
            };

            if (photoResponse && photoResponse.id) {
              sessionUpdates.photo = photoResponse;
            } else if (this.photoManager.deletePending()) {
              sessionUpdates.photo = null;
            }

            this._authService.updateCurrentUser(sessionUpdates);
          }

          this._router.navigate(['admin/view-profile', this.adminId()]);
        },
        error: (err) => {
          this._errorService.handle(err, 'actualizar el perfil');
        },
      });
  }

  goBack(): void {
    this._router.navigate(['admin/view-profile', this.adminId()]);
  }
}
