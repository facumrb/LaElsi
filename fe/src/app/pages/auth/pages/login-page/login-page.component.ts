import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { AdminDataService } from '@services/admin-data-service.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  formLoginAdmin!: FormGroup;
  private _adminDataService = inject(AdminDataService);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  loading: boolean = false;
  errorMessage: string = '';
  passwordVisible: boolean = false;
  showEyeIcon: boolean = false;

  constructor(private formBuilder: FormBuilder) {
    this.formLoginAdmin = this.formBuilder.group({
      user: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9áéíóúÁÉÍÓÚñÑ.,;:?!()_\'"-s]*$',
          ),
        ],
      ],
      password: ['', [Validators.required]],
    });
  }

  enviar(event: Event): boolean {
    event.preventDefault();

    // Si el formulario no es válido, marcamos todos los campos como tocados para mostrar errores.
    if (this.formLoginAdmin.invalid) {
      this.formLoginAdmin.markAllAsTouched();
      return false;
    }

    // Mostramos un spinner y ocultamos mensajes de error mientras procesamos.
    this.loading = true;
    this.errorMessage = ''; // Limpiamos cualquier mensaje de error anterior.

    const { user, password } = this.formLoginAdmin.value;

    // Llamamos al servicio de autenticación.
    this._authService.login(user, password).subscribe({
      next: (response) => {
        this.loading = false;
        this._adminDataService.setAdminId(response.user.id);
        this._router.navigate(['/admin']); // Redirigimos al home del administrador.
      },
      error: (error) => {
        this.loading = false;
        // Manejo de errores según el código de estado.
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Usuario o contraseña incorrectos.'; //Error del servidor. Por favor, intenta más tarde.
        } else {
          this.errorMessage =
            'Ocurrió un error inesperado. Inténtalo más tarde.';
        }
      },
    });

    return true;
  }

  hasErrors(field: string, typeError: string) {
    return (
      this.formLoginAdmin.get(field)?.hasError(typeError) &&
      this.formLoginAdmin.get(field)?.touched
    );
  }

  //MOSTRAR O NO EL ICONO DEL OJO
  onPasswordInput(): void {
    const passwordValue = this.formLoginAdmin.get('password')?.value || '';
    this.showEyeIcon = passwordValue.length > 0;
  }

  //MOSTRAR CONTRASEÑA
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible; // Alterna la visibilidad
  }
}
