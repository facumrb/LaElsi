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

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIconComponent,
    FieldErrorComponent,
    GoBackButtonComponent,
    TrimInputDirective,
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
  errorMessage = signal('');

  formRegister = this.fb.nonNullable.group({
    name: ['', [Validators.required, FormUtils.minLength(2)]],
    lastName: ['', [Validators.required, FormUtils.minLength(2)]],
    dni: [
      '',
      [Validators.required, Validators.pattern('^[0-9]{7,8}$')],
      [FormUtils.uniqueFieldValidator('Client', 'dni', this.http)],
    ],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
    username: [
      '',
      [Validators.required, FormUtils.minLength(4)],
      [FormUtils.uniqueFieldValidator('Client', 'username', this.http)],
    ],
    email: [
      '',
      [Validators.required, Validators.email],
      [FormUtils.uniqueFieldValidator('Client', 'email', this.http)],
    ],
    password: ['', [Validators.required, FormUtils.minLength(6)]],
  });

  get formPending() {
    return this.formRegister.pending;
  }

  onSubmit() {
    if (this.formRegister.invalid) {
      this.formRegister.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const registerData = this.formRegister.getRawValue();

    this.authService.register(registerData).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al registrarse');
      },
    });
  }
}
