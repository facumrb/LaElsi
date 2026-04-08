import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapArrowClockwise } from '@ng-icons/bootstrap-icons';
import { FormUtils } from '@shared/validators/form-utils';
import { AlertService } from '@services/alert.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoBackButtonComponent } from '@shared/components/buttons/go-back-button/go-back-button.component';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';
import { TrimInputDirective } from '@shared/directives/trim-input.directive';
import { PasswordToggleButtonComponent } from '@shared/components/buttons/password-toggle-button/password-toggle-button.component';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIconComponent,
    GoBackButtonComponent,
    FieldErrorComponent,
    TrimInputDirective,
    PasswordToggleButtonComponent,
    LogoComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowClockwise,
    }),
  ],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private alertService = inject(AlertService);

  // Signals para el estado de la UI
  loading = signal(false);
  passwordVisible = signal(false);

  formLogin = this.fb.group({
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
    password: ['', [FormUtils.maxLength(100), Validators.required]],
  });

  // Lógica UI para el input de contraseña
  private passwordValue = toSignal(
    this.formLogin.get('password')!.valueChanges,
    { initialValue: '' },
  );

  showEyeIcon = computed(() => {
    const val = this.passwordValue();
    return val ? val.length > 0 : false;
  });

  forgotPassword() {
    this.alertService.recoverPassword();
  }

  onSubmit() {
    if (!this.formLogin.valid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { username, password } = this.formLogin.getRawValue();

    this.authService.login(username!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.alertService.toast('¡Bienvenido de nuevo!', 'success');

        // Lógica de redireccionamiento post-login
        const returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          // Si existe una ruta de retorno (ej: /cart-page), vamos allí
          this.router.navigateByUrl(returnUrl);
        } else {
          // Si no existe, navegamos al home correspondiente según el rol
          if (this.authService.isAdmin()) {
            this.router.navigate(['/admin']); // Dashboard Admin
          } else {
            this.router.navigate(['/']); // Home Cliente
          }
        }
      },
      error: (error) => {
        this.loading.set(false);
      },
    });
  }
}
