import { Component, inject, signal } from '@angular/core';
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
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { PhoneInputDirective } from '@shared/directives/phone-input.directive';

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIconComponent,
    FieldErrorComponent,
    GoBackButtonComponent,
    TrimInputDirective,
    NumericInputDirective,
    PhoneInputDirective,
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

  loading = signal(false);

  formRegister = this.fb.nonNullable.group({
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
      [FormUtils.uniqueFieldValidator('Client', 'dni', this.http)],
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
    username: [
      '',
      [
        Validators.required,
        FormUtils.minLength(4),
        FormUtils.maxLength(30),
        Validators.pattern(FormUtils.usernamePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
      [FormUtils.uniqueFieldValidator('Client', 'username', this.http)],
    ],
    email: [
      '',
      [
        Validators.required,
        FormUtils.maxLength(255),
        Validators.pattern(FormUtils.emailPattern),
      ],
      [FormUtils.uniqueFieldValidator('Client', 'email', this.http)],
    ],
    password: [
      '',
      [
        Validators.required,
        FormUtils.maxLength(100),
        Validators.pattern(FormUtils.passwordPattern),
      ],
    ],
  });

  onSubmit() {
    if (!this.formRegister.valid) {
      this.formRegister.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const registerData = this.formRegister.getRawValue();

    this.authService.register(registerData).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' },
        });
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
