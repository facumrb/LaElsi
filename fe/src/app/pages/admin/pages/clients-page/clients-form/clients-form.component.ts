import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { switchMap } from 'rxjs';
import { ApiClientService } from '@services/api-client.service';
import { AuthService } from '@services/auth.service';
import { ICreateClient, UserRole, FiscalCondition } from '@models/user.model';
import { IApiUserPhoto } from '@models/photo.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowLeft,
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { PhotoManagerComponent } from '@shared/photo-manager/photo-manager.component';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/form-utils';
import { NumericInputDirective } from '@shared/numeric-input.directive';
import { ClickOutsideDirective } from '@shared/click-outside.directive';

@Component({
  selector: 'app-clients-form',
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    NumericInputDirective,
    PhotoManagerComponent,
    ClickOutsideDirective,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
      bootstrapChevronDown,
      bootstrapCheckLg,
    }),
  ],
  providers: [DatePipe],
  templateUrl: './clients-form.component.html',
})
export class ClientsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private routeActive = inject(ActivatedRoute);
  private location = inject(Location);
  private clientService = inject(ApiClientService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private datePipe = inject(DatePipe);

  formUtils = FormUtils;

  @ViewChild(PhotoManagerComponent) photoManager!: PhotoManagerComponent;

  isEditMode = signal(false);
  clientId = signal<number | null>(null);
  currentPhoto = signal<IApiUserPhoto | null>(null);

  fiscalConditions = Object.values(FiscalCondition);
  isFiscalMenuOpen = signal(false);

  // Alternar estado
  toggleFiscalMenu() {
    this.isFiscalMenuOpen.update((v) => !v);
  }

  // Seleccionar opción y cerrar
  selectFiscalCondition(value: string) {
    this.formClient.get('fiscalCondition')?.setValue(value as any);
    this.isFiscalMenuOpen.set(false);
  }

  formClient = this.fb.group({
    // --- DATOS PERSONALES ---
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    last_name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    dni: [
      '',
      [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(15),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],
    phone: [
      '',
      [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(15),
        Validators.pattern(FormUtils.numberPattern),
      ],
    ],

    // --- CUENTA DE USUARIO ---
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.pattern(FormUtils.namePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    email: [
      '',
      [Validators.required, Validators.pattern(FormUtils.emailPattern)],
    ],
    password: ['', [Validators.pattern(FormUtils.passwordPattern)]],

    // --- DATOS DE FACTURACIÓN ---
    cuit: ['', [Validators.pattern(FormUtils.cuitPattern)]],
    fiscalCondition: [FiscalCondition.ConsumidorFinal],

    // --- DIRECCIÓN ---
    street: [''],
    streetNumber: [''],
    city: [''],
    province: [''],
    postalCode: [''],
    floor: [''],
    apartment: [''],

    // --- AUDITORÍA ---
    createdAt: [{ value: '', disabled: true }],
    updatedAt: [{ value: '', disabled: true }],
    deletedAt: [{ value: '', disabled: true }],
  });

  ngOnInit() {
    this.checkEditMode();
    if (!this.isEditMode()) {
      this.formClient.get('password')?.addValidators(Validators.required);
    }
  }

  checkEditMode() {
    const id = this.routeActive.snapshot.paramMap.get('id');
    if (id) {
      this.loadClientData(+id);
    }
  }

  loadClientData(id: number) {
    this.clientId.set(id);
    this.isEditMode.set(true);

    this.clientService.getClientById(id).subscribe({
      next: (client) => {
        this.currentPhoto.set(client.photo);
        const dateFormat = 'dd/MM/yyyy HH:mm';

        this.formClient.patchValue({
          name: client.name,
          last_name: client.last_name,
          dni: client.dni,
          phone: client.phone,
          username: client.username,
          email: client.email,

          // Mapeo de campos extra
          cuit: client.cuit || '',
          fiscalCondition:
            client.fiscalCondition || FiscalCondition.ConsumidorFinal,
          street: client.street || '',
          streetNumber: client.streetNumber
            ? client.streetNumber.toString()
            : '',
          city: client.city || '',
          province: client.province || '',
          postalCode: client.postalCode || '',
          floor: client.floor || '',
          apartment: client.apartment || '',

          createdAt: this.datePipe.transform(client.createdAt, dateFormat),
          updatedAt: this.datePipe.transform(client.updatedAt, dateFormat),
          deletedAt: client.deletedAt
            ? this.datePipe.transform(client.deletedAt, dateFormat)
            : 'No eliminado',
        });

        this.formClient.get('password')?.removeValidators(Validators.required);
        this.formClient.get('password')?.updateValueAndValidity();
      },
      error: () => {
        this.alertService.toast('Error al cargar cliente', 'error');
        this.goBack();
      },
    });
  }

  get fullName(): string {
    const name = this.formClient.get('name')?.value || '';
    const lastName = this.formClient.get('last_name')?.value || '';
    return `${name} ${lastName}`;
  }

  goBack() {
    this.location.back();
  }

  onSubmit() {
    if (this.formClient.invalid) {
      this.formClient.markAllAsTouched();
      return;
    }

    const formValue = this.formClient.getRawValue();

    // Construimos el objeto ICreateClient
    const clientData: ICreateClient = {
      name: formValue.name!,
      last_name: formValue.last_name!,
      dni: formValue.dni!,
      phone: formValue.phone!,
      username: formValue.username!,
      email: formValue.email!,
      password: formValue.password || '',
      role: UserRole.Client,

      // Campos opcionales
      cuit: formValue.cuit || undefined,
      fiscalCondition: formValue.fiscalCondition as FiscalCondition,
      street: formValue.street || undefined,
      streetNumber: formValue.streetNumber
        ? Number(formValue.streetNumber)
        : undefined,
      city: formValue.city || undefined,
      province: formValue.province || undefined,
      postalCode: formValue.postalCode || undefined,
      floor: formValue.floor || undefined,
      apartment: formValue.apartment || undefined,
    };

    if (this.isEditMode() && !clientData.password) {
      delete (clientData as any).password;
    }

    // Guardar datos
    let request$;
    if (this.isEditMode() && this.clientId()) {
      request$ = this.clientService.updateClient(this.clientId()!, clientData);
    } else {
      request$ = this.clientService.addClient(clientData);
    }

    // Procesar foto y guardar
    request$
      .pipe(
        switchMap((res: any) => {
          const userId = this.isEditMode()
            ? this.clientId()!
            : res.id || res.data?.id;

          if (!userId) {
            console.error(
              'No se pudo obtener el ID del usuario para subir la foto',
            );
            return [];
          }
          return this.photoManager.saveChanges(userId);
        }),
      )
      .subscribe({
        next: (photoResponse: any) => {
          this.alertService.toast('Guardado exitosamente', 'success');

          // Lógica de actualización de sesión si me edito a mí mismo (poco probable en panel admin pero buena práctica)
          const currentUserId = this.authService.currentUser()?.id;
          if (this.clientId() === currentUserId) {
            // ... lógica de actualización de sesión similar al admin ...
          }

          this.router.navigate(['/admin/clients']); // Redirigir a listado de clientes
        },
        error: (err) => {
          console.error(err);
          this.alertService.toast('Error al guardar (revise la foto)', 'error');
        },
      });
  }
}
