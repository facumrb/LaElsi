import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { ApiClientService } from '@services/api-client.service';
import { ApiOrderService } from '@services/api-order.service';
import Swal from 'sweetalert2';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPerson,
  bootstrapReceipt,
  bootstrapGeoAlt,
  bootstrapClockHistory,
  bootstrapCheckCircle,
  bootstrapXCircle,
  bootstrapBoxSeam,
} from '@ng-icons/bootstrap-icons';
import { IApiClient, IUpdateClient, FiscalCondition } from '@models/user.model';
import { IApiOrder } from '@models/order.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, NgIconComponent, DatePipe, CurrencyPipe],
  viewProviders: [
    provideIcons({
      bootstrapPerson,
      bootstrapReceipt,
      bootstrapGeoAlt,
      bootstrapClockHistory,
      bootstrapCheckCircle,
      bootstrapXCircle,
      bootstrapBoxSeam,
    }),
  ],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiClientService = inject(ApiClientService);
  private apiOrderService = inject(ApiOrderService);

  loading = signal(true);
  saving = signal(false);
  misPedidos = signal<IApiOrder[]>([]);

  // Señal del usuario actual
  currentUserSignal = this.authService.currentUser;

  fullProfile = signal<IApiClient | null>(null);

  fiscalConditions = Object.values(FiscalCondition);

  formPerfil = this.fb.nonNullable.group({
    // Datos personales
    name: ['', Validators.required],
    lastName: ['', Validators.required],
    dni: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],

    // Datos de facturación
    cuit: ['', [Validators.pattern('^[0-9]{11}$')]],
    fiscalCondition: [FiscalCondition.ConsumidorFinal],

    // Dirección
    street: [''],
    streetNumber: [0],
    city: [''],
    province: [''],
    postalCode: [''],
    floor: [''],
    apartment: [''],
  });

  ngOnInit(): void {
    const userSummary = this.currentUserSignal();

    if (userSummary) {
      // Usamos el ID para buscar la info COMPLETA en la base de datos
      this.loadFullProfile(userSummary.id);
    } else {
      this.loading.set(false);
    }
  }

  private loadFullProfile(id: number) {
    this.apiClientService.getClientById(id).subscribe({
      next: (fullUser) => {
        this.fullProfile.set(fullUser);
        this.formPerfil.patchValue({
          name: fullUser.name,
          lastName: fullUser.lastName,
          dni: fullUser.dni,
          email: fullUser.email,
          phone: fullUser.phone,

          // Manejo de opcionales: Si es null/undefined, ponemos string vacío
          cuit: fullUser.cuit || '',
          fiscalCondition:
            fullUser.fiscalCondition || FiscalCondition.ConsumidorFinal,
          street: fullUser.street || '',
          streetNumber: fullUser.streetNumber || 0, // Si es null, ponemos 0
          city: fullUser.city || '',
          province: fullUser.province || '',
          postalCode: fullUser.postalCode || '',
          floor: fullUser.floor || '',
          apartment: fullUser.apartment || '',
        });

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
        Swal.fire(
          'Error',
          'No se pudo cargar la información del perfil',
          'error',
        );
      },
    });

    this.apiOrderService.getOrdersByClient(id).subscribe({
      next: (orders) => this.misPedidos.set(orders),
      error: (err) => console.error('Error al cargar pedidos', err),
    });
  }

  onSubmit() {
    if (this.formPerfil.invalid) {
      this.formPerfil.markAllAsTouched();
      return;
    }

    // Verificación de ID antes de activar el loading
    const userId = this.currentUserSignal()?.id;
    if (!userId) {
      Swal.fire('Error', 'No se pudo identificar al usuario', 'error');
      return;
    }

    this.saving.set(true);

    const rawValue = this.formPerfil.getRawValue();

    // Construimos un objeto limpio solo con los datos que queremos actualizar.
    const clientData: IUpdateClient = {
      name: rawValue.name,
      lastName: rawValue.lastName,
      dni: rawValue.dni,
      email: rawValue.email,
      phone: rawValue.phone,
      cuit: rawValue.cuit,
      fiscalCondition: rawValue.fiscalCondition as FiscalCondition,
      street: rawValue.street,

      // Aseguramos que sea number o undefined
      streetNumber: rawValue.streetNumber
        ? Number(rawValue.streetNumber)
        : undefined,

      city: rawValue.city,
      province: rawValue.province,
      postalCode: rawValue.postalCode,
      floor: rawValue.floor,
      apartment: rawValue.apartment,
    };

    this.apiClientService.updateClient(userId, clientData).subscribe({
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
