import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { HttpClient } from '@angular/common/http';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapArrowClockwise, bootstrapCheckCircleFill, bootstrapXCircleFill } from '@ng-icons/bootstrap-icons';
import { uniqueFieldValidator } from '@shared/validators/unique.validator';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapArrowClockwise,
      bootstrapCheckCircleFill,
      bootstrapXCircleFill,
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
    name: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    dni: [
      '',
      [Validators.required, Validators.pattern('^[0-9]{7,8}$')],
      [uniqueFieldValidator('Client', 'dni', this.http)],
    ],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
    username: [
      '',
      [Validators.required, Validators.minLength(4)],
      [uniqueFieldValidator('Client', 'username', this.http)],
    ],
    email: [
      '',
      [Validators.required, Validators.email],
      [uniqueFieldValidator('Client', 'email', this.http)],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  hasErrors(field: string, type: string) {
    const control = this.formRegister.get(field);
    return control?.hasError(type) && control?.touched;
  }

  isPending(field: string) {
    return this.formRegister.get(field)?.pending;
  }

  isValid(field: string) {
    const control = this.formRegister.get(field);
    return control?.valid && control?.value && !control.pristine;
  }

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
