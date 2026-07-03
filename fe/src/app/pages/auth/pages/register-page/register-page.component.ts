import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { HttpClient } from '@angular/common/http';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapArrowClockwise } from '@ng-icons/bootstrap-icons';
import { FormUtils } from '@shared/validators/form-utils';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';
import { GoBackButtonComponent } from '@shared/components/buttons/go-back-button/go-back-button.component';
import { TrimInputDirective } from '@shared/directives/trim-input.directive';
import { PasswordToggleButtonComponent } from '@shared/components/buttons/password-toggle-button/password-toggle-button.component';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertService } from '@services/alert.service';
import { finalize } from 'rxjs';
import { IClientRegister } from '@models/auth.model';


@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIconComponent,
    FieldErrorComponent,
    GoBackButtonComponent,
    TrimInputDirective,
    PasswordToggleButtonComponent,
    LogoComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowClockwise,
    }),
  ],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private alertService = inject(AlertService);

  loading = signal(false);
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  formRegister = this.fb.nonNullable.group(
    {
      username: [
        '',
        {
          validators: [
            Validators.required,
            FormUtils.minLength(4),
            FormUtils.maxLength(30),
            Validators.pattern(FormUtils.usernamePattern),
            FormUtils.notOnlyWhiteSpace,
          ],
          asyncValidators: [
            FormUtils.uniqueFieldValidator('Client', 'username', this.http),
          ],
        },
      ],
      email: [
        '',
        {
          validators: [
            Validators.required,
            FormUtils.maxLength(255),
            Validators.pattern(FormUtils.emailPattern),
          ],
          asyncValidators: [
            FormUtils.uniqueFieldValidator('Client', 'email', this.http),
          ],
        },
      ],
      password: [
        '',
        [
          Validators.required,
          FormUtils.maxLength(100),
          Validators.pattern(FormUtils.passwordPattern),
        ],
      ],
      confirmPassword: [
        '',
        [Validators.required, FormUtils.notOnlyWhiteSpace],
      ],
    },
    {
      validators: FormUtils.isFieldOneEqualFieldTwo(
        'password',
        'confirmPassword',
      ),
    },
  );


  private formStatus = toSignal(this.formRegister.statusChanges, {
    initialValue: this.formRegister.status,
  });

  isPending = computed(() => this.formStatus() === 'PENDING');
  isValid = computed(() => this.formStatus() === 'VALID');

  private passwordValue = toSignal(
    this.formRegister.get('password')!.valueChanges,
    { initialValue: '' },
  );

  private confirmPasswordValue = toSignal(
    this.formRegister.get('confirmPassword')!.valueChanges,
    { initialValue: '' },
  );

  showEyeIcon = computed(() => {
    const val = this.passwordValue();
    return !!(val && val.length > 0);
  });

  showConfirmEyeIcon = computed(() => {
    const val = this.confirmPasswordValue();
    return !!(val && val.length > 0);
  });

  onSubmit() {
    if (!this.isValid()) {
      this.formRegister.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { confirmPassword, ...registerData } = this.formRegister.getRawValue();

    this.authService
      .register(registerData as IClientRegister)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.alertService.toast('¡Cuenta creada exitosamente!', 'success');
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: 'true' },
          });
        },
        error: (err) => {
          const message =
            err.error?.message ||
            'Ocurrió un error al intentar crear tu cuenta.';
          this.alertService.toast(message, 'error');
        },
      });

  }
}
