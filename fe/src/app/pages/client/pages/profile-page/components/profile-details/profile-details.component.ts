import {
  Component,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPerson,
  bootstrapReceipt,
  bootstrapGeoAlt,
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { IApiClient, IUpdateClient, FiscalCondition } from '@models/user.model';
import { ApiClientService } from '@services/api-client.service';
import Swal from 'sweetalert2';
import { PhoneInputDirective } from '@shared/directives/phone-input.directive';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-profile-details',
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    PhoneInputDirective,
    NumericInputDirective,
    ClickOutsideDirective,
  ],
  viewProviders: [
    provideIcons({
      bootstrapPerson,
      bootstrapReceipt,
      bootstrapGeoAlt,
      bootstrapChevronDown,
      bootstrapCheckLg,
    }),
  ],
  templateUrl: './profile-details.component.html',
})
export class ProfileDetailsComponent {
  private fb = inject(FormBuilder);
  private apiClientService = inject(ApiClientService);

  profile = input<IApiClient | null>(null);

  // Como output, disparamos un evento para decir que se actualizó
  @Output() profileUpdated = new EventEmitter<void>();

  saving = signal(false);
  fiscalConditions = Object.values(FiscalCondition);
  isFiscalMenuOpen = signal(false);

  formPerfil = this.fb.nonNullable.group({
    name: ['', Validators.required],
    lastName: ['', Validators.required],
    dni: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    cuit: ['', [Validators.pattern('^[0-9]{11}$')]],
    fiscalCondition: [FiscalCondition.ConsumidorFinal],
    street: [''],
    streetNumber: [0],
    city: [''],
    province: [''],
    postalCode: [''],
    floor: [''],
    apartment: [''],
  });

  ngOnInit() {
    if (this.profile()) {
      this.patchForm(this.profile()!);
    }
  }

  // Permite detectar los check de changes
  ngOnChanges() {
    if (this.profile()) {
      this.patchForm(this.profile()!);
    }
  }

  toggleFiscalMenu() {
    this.isFiscalMenuOpen.update((v) => !v);
  }

  selectFiscalCondition(condition: FiscalCondition) {
    this.formPerfil.patchValue({ fiscalCondition: condition });
    this.isFiscalMenuOpen.set(false);
  }

  private patchForm(fullUser: IApiClient) {
    this.formPerfil.patchValue({
      name: fullUser.name,
      lastName: fullUser.lastName,
      dni: fullUser.dni,
      email: fullUser.email,
      phone: fullUser.phone,
      cuit: fullUser.cuit || '',
      fiscalCondition:
        fullUser.fiscalCondition || FiscalCondition.ConsumidorFinal,
      street: fullUser.street || '',
      streetNumber: fullUser.streetNumber || 0,
      city: fullUser.city || '',
      province: fullUser.province || '',
      postalCode: fullUser.postalCode || '',
      floor: fullUser.floor || '',
      apartment: fullUser.apartment || '',
    });
  }

  onSubmit() {
    if (this.formPerfil.invalid) {
      this.formPerfil.markAllAsTouched();
      return;
    }

    const userId = this.profile()?.id;
    if (!userId) return;

    this.saving.set(true);
    const rawValue = this.formPerfil.getRawValue();

    const clientData: IUpdateClient = {
      name: rawValue.name,
      lastName: rawValue.lastName,
      dni: rawValue.dni,
      email: rawValue.email,
      phone: rawValue.phone,
      cuit: rawValue.cuit,
      fiscalCondition: rawValue.fiscalCondition as FiscalCondition,
      street: rawValue.street,
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
        this.profileUpdated.emit();
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
