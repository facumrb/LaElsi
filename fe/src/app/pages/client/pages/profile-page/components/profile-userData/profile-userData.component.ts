import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapShieldLock } from '@ng-icons/bootstrap-icons';
import { IApiClient } from '@models/user.model';
import { ApiClientService } from '@services/api-services/api-client.service';
import { AlertService } from '@services/alert.service';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { FormUtils } from '@shared/validators/form-utils';
import { switchMap } from 'rxjs';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';
import { TrimInputDirective } from '@shared/directives/trim-input.directive';

@Component({
  selector: 'app-profile-user',
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    PhotoManagerComponent,
    FieldErrorComponent,
    TrimInputDirective,
  ],
  viewProviders: [provideIcons({ bootstrapShieldLock })],
  templateUrl: './profile-userData.component.html',
})
export class ProfileUserComponent {
  private fb = inject(FormBuilder);
  private apiClientService = inject(ApiClientService);
  private http = inject(HttpClient);
  private alertService = inject(AlertService);

  profile = input<IApiClient | null>(null);

  profileUpdated = output<void>();
  photoManager = viewChild.required(PhotoManagerComponent);

  saving = signal(false);

  formUsuario = this.fb.nonNullable.group({
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
    password: [
      '',
      [FormUtils.maxLength(100), Validators.pattern(FormUtils.passwordPattern)],
    ],
  });

  constructor() {
    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.patchForm(profile);
      }
    });
  }

  private patchForm(fullUser: IApiClient) {
    this.formUsuario.patchValue({
      username: fullUser.username || '',
    });

    // Validación async para edición
    this.formUsuario.controls.username.setAsyncValidators(
      FormUtils.uniqueFieldValidator(
        'Client',
        'username',
        this.http,
        fullUser.id,
      ),
    );
  }

  onSubmit() {
    if (!this.formUsuario.valid) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    const userId = this.profile()?.id;
    if (!userId) return;

    this.saving.set(true);
    const rawValue = this.formUsuario.getRawValue();

    const clientData: any = {
      username: rawValue.username,
    };
    if (rawValue.password && rawValue.password.trim() !== '') {
      clientData.password = rawValue.password;
    }

    this.apiClientService
      .updateClient(userId, clientData)
      .pipe(switchMap(() => this.photoManager().saveChanges(userId)))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.alertService.toast('Datos de usuario actualizados', 'success');
          this.formUsuario.get('password')?.setValue('');
          this.profileUpdated.emit();
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }
}
