import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiAdminService } from '@services/api-admin.service';
import { IApiAdmin, ICreateAdmin, UserRole } from '@models/user.model';
import { IApiUserPhoto } from '@models/photo.model';
import { AuthService } from '@services/auth.service';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/validators/form-utils';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';
import { GoBackButtonComponent } from '@shared/components/buttons/go-back-button/go-back-button.component';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { PhoneInputDirective } from '@shared/directives/phone-input.directive';
import { TrimInputDirective } from '@shared/directives/trim-input.directive';

@Component({
  selector: 'app-edit-profile-page',
  imports: [
    ReactiveFormsModule,
    PhotoManagerComponent,
    FieldErrorComponent,
    GoBackButtonComponent,
    NumericInputDirective,
    PhoneInputDirective,
    TrimInputDirective,
  ],
  templateUrl: './edit-profile-page.component.html',
})
export class EditProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiAdminService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);

  @ViewChild(PhotoManagerComponent) photoManager!: PhotoManagerComponent;

  formUtils = FormUtils;
  currentPhoto = signal<IApiUserPhoto | null>(null);
  initialFormValue = signal<string>('');

  formEditProfile = this.fb.group({
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
    phone: [
      '',
      [
        Validators.required,
        FormUtils.minLength(7),
        FormUtils.maxLength(20),
        Validators.pattern(FormUtils.phonePattern),
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
  });

  get formPending() {
    return this.formEditProfile.pending;
  }

  ngOnInit(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.fetchAdmin(userId);
    }
  }

  private fetchAdmin(id: number): void {
    this.apiService.getAdminById(id).subscribe({
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
        this.formEditProfile.controls.dni.setAsyncValidators(
          FormUtils.uniqueFieldValidator('Admin', 'dni', this.http, id),
        );
        this.formEditProfile.controls.username.setAsyncValidators(
          FormUtils.uniqueFieldValidator('Admin', 'username', this.http, id),
        );
        this.formEditProfile.controls.email.setAsyncValidators(
          FormUtils.uniqueFieldValidator('Admin', 'email', this.http, id),
        );

        this.initialFormValue.set(
          JSON.stringify(this.formEditProfile.getRawValue()),
        );
      },
      error: () => {
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

    const userId = this.authService.currentUser()?.id;
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

    this.apiService
      .updateAdmin(userId!, adminData)
      .pipe(
        switchMap(() => {
          return this.photoManager.saveChanges(userId!);
        }),
      )
      .subscribe({
        next: (photoResponse: any) => {
          this.alertService.toast('Perfil actualizado con éxito', 'success');

          const sessionUpdates: any = {
            name: formValue.name,
            lastName: formValue.lastName,
          };

          if (photoResponse && photoResponse.id) {
            sessionUpdates.photo = photoResponse;
          } else if (this.photoManager.deletePending()) {
            sessionUpdates.photo = null;
          }

          this.authService.updateCurrentUser(sessionUpdates);
          this.router.navigate(['admin/view-profile']);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['admin/view-profile']);
  }
}
