import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapEye,
  bootstrapEyeSlash,
  bootstrapArrowClockwise,
  bootstrapArrowLeft,
} from '@ng-icons/bootstrap-icons';
import { FormUtils } from '@shared/form-utils';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapEye,
      bootstrapEyeSlash,
      bootstrapArrowClockwise,
      bootstrapArrowLeft,
    }),
  ],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedroute = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private apiErrorService = inject(ApiErrorService);

  formUtils = FormUtils;

  // Signals para el estado de la UI
  loading = signal(false);
  passwordVisible = signal(false);
  showEyeIcon = signal(false);

  formLogin = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.pattern(FormUtils.namePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    password: ['', [Validators.required]],
  });

  // Lógica UI para el input de contraseña
  onPasswordInput(): void {
    const passwordValue = this.formLogin.get('password')?.value || '';
    this.showEyeIcon.set(passwordValue.length > 0);
  }
  togglePasswordVisibility(): void {
    this.passwordVisible.update((current) => !current);
  }

  goBack() {
    this.router.navigate(['/']); // Navega al E-commerce
  }

  onSubmit() {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { username, password } = this.formLogin.getRawValue();

    this.authService.login(username!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.alertService.toast('¡Bienvenido de nuevo!', 'success');

        // Logica de redireccionamiento post-login
        const returnUrl = this.activatedroute.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          // Si existe, vamos directo ahí (ej: /checkout)
          this.router.navigateByUrl(returnUrl);
        } else {
          // Si no existe, decidimos según el rol
          if (this.authService.isAdmin()) {
            this.router.navigate(['/admin']); // Dashboard Admin
          } else {
            this.router.navigate(['/']); // Home Cliente
          }
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.apiErrorService.handle(error, 'iniciar sesión');
      },
    });
  }
}
