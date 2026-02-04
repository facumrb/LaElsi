import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { ApiClientService } from '@services/api-client.service';
import { IApiClient } from '@models/user.model';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiClientService = inject(ApiClientService);

  loading = signal(true);
  saving = signal(false);
  userData = signal<IApiClient | null>(null);

  fiscalConditions = [
    'Consumidor Final',
    'Responsable Inscripto',
    'Monotributista',
    'Exento',
  ];

  formPerfil = this.fb.group({
    // Datos personales (Readonly o fijos por ahora)
    name: [{ value: '', disabled: true }],
    last_name: [{ value: '', disabled: true }],
    dni: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    phone: ['', Validators.required],

    // Datos de facturación
    cuit: ['', [Validators.pattern('^[0-9]{11}$')]],
    fiscalCondition: ['Consumidor Final'],

    // Dirección
    street: [''],
    streetNumber: [null as number | null],
    city: [''],
    province: [''],
    postalCode: [''],
    floor: [''],
    apartment: [''],
  });

  ngOnInit(): void {
    const userSummary = this.authService.getUser();
    if (userSummary) {
      this.apiClientService.getClientById(userSummary.id).subscribe({
        next: (fullUser) => {
          this.userData.set(fullUser);
          this.formPerfil.patchValue(fullUser as any);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          Swal.fire(
            'Error',
            'No se pudo cargar la información del perfil',
            'error',
          );
        },
      });
    }
  }

  onSubmit() {
    if (this.formPerfil.invalid || !this.userData()) return;

    this.saving.set(true);
    const updatedData = { ...this.formPerfil.value } as any;

    this.apiClientService
      .updateClient(this.userData()!.id, updatedData)
      .subscribe({
        next: () => {
          this.saving.set(false);
          Swal.fire('¡Éxito!', 'Perfil actualizado correctamente', 'success');
        },
        error: (err) => {
          this.saving.set(false);
          Swal.fire(
            'Error',
            err.error?.message || 'Error al actualizar',
            'error',
          );
        },
      });
  }
}
