import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAdminService } from '@services/api-admin.service';
import { CommonModule } from '@angular/common';
import { IApiAdmin } from '@models/user.model';

@Component({
  selector: 'app-edit-profile-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile-page.component.html',
  styleUrl: './edit-profile-page.component.css',
})
export class EditProfilePageComponent implements OnInit {
  formEditProfile!: FormGroup;
  loading: boolean = true;
  admin?: IApiAdmin;
  errorMessage: string = '';

  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _apiService = inject(ApiAdminService);

  constructor(private formBuilder: FormBuilder) {
    this.formEditProfile = this.formBuilder.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],

      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      username: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      const adminId = params['id'];
      this.fetchAdmin(adminId);
    });
  }

  // Obtener los detalles del administrador desde la API
  private fetchAdmin(id: number): void {
    this._apiService.getAdminById(id).subscribe({
      next: (data: IApiAdmin) => {
        this.admin = data;
        this.loading = false;
        this.formEditProfile.patchValue({
          name: this.admin.name,
          lastName: this.admin.lastName,
          phone: this.admin.phone,
          username: this.admin.username,
          email: this.admin.email,
        });
      },
      error: (error) => {
        this.loading = false;
        // Manejo de errores según el código de estado.
        if (error.status >= 500) {
          this.errorMessage =
            'Error del servidor. Por favor, intenta más tarde.';
        } else {
          this.errorMessage =
            'Ocurrió un error inesperado. Inténtalo más tarde.';
        }
      },
    });
  }

  // Método para guardar los cambios del perfil
  guardarCambios(event: Event): void {
    event.preventDefault();
    if (this.admin) {
      // Actualizamos los datos con los valores del formulario
      const updatedAdmin = { ...this.admin, ...this.formEditProfile.value };

      this._apiService.updateAdmin(this.admin.id, updatedAdmin).subscribe({
        next: () => {
          alert('Perfil actualizado con éxito');
          this._router.navigate(['admin/view-profile', this.admin?.id]);
        },
        error: (error) => {
          this.errorMessage = 'Error del servidor.';
        },
      });
    }
  }

  // Método para volver atrás sin guardar
  volverAtras(): void {
    this._router.navigate(['admin/view-profile', this.admin?.id]);
  }

  hasErrors(field: string, typeError: string) {
    return (
      this.formEditProfile.get(field)?.hasError(typeError) &&
      this.formEditProfile.get(field)?.touched
    );
  }
}
