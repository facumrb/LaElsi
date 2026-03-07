import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { switchMap } from 'rxjs';
import { ApiClientService } from '@services/api-client.service';
import { AuthService } from '@services/auth.service';
import { ICreateClient, UserRole, FiscalCondition } from '@models/user.model';
import { IApiUserPhoto } from '@models/photo.model';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowLeft,
  bootstrapChevronDown,
  bootstrapCheckLg,
  bootstrapArrowClockwise,
  bootstrapCheckCircleFill,
  bootstrapXCircleFill,
} from '@ng-icons/bootstrap-icons';
import { uniqueFieldValidator } from '@shared/validators/unique.validator';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { AlertService } from '@shared/alert.service';
import { FormUtils } from '@shared/form-utils';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { AuditInfoComponent } from '@shared/components/audit-info/audit-info.component';
import { PhoneInputDirective } from '@shared/directives/phone-input.directive';

@Component({
  selector: 'app-clients-form',
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    NumericInputDirective,
    PhoneInputDirective,
    PhotoManagerComponent,
    ClickOutsideDirective,
    AuditInfoComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
      bootstrapChevronDown,
      bootstrapCheckLg,
      bootstrapArrowClockwise,
      bootstrapCheckCircleFill,
      bootstrapXCircleFill,
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
  private http = inject(HttpClient);

  formUtils = FormUtils;

  @ViewChild(PhotoManagerComponent) photoManager!: PhotoManagerComponent;

  isEditMode = signal(false);
  clientId = signal<number | null>(null);
  currentPhoto = signal<IApiUserPhoto | null>(null);

  // Signal para guardar el estado inicial del formulario
  initialFormValue = signal<string>('');

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
        Validators.maxLength(100),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
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
        Validators.maxLength(20),
        Validators.pattern(FormUtils.phonePattern),
      ],
    ],

    // --- CUENTA DE USUARIO ---
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(FormUtils.usernamePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    email: [
      '',
      [
        Validators.required,
        Validators.maxLength(255),
        Validators.pattern(FormUtils.emailPattern),
      ],
    ],
    password: [
      '',
      [
        Validators.maxLength(100),
        Validators.pattern(FormUtils.passwordPattern),
      ],
    ],

    // --- DATOS DE FACTURACIÓN ---
    fiscalCondition: [FiscalCondition.ConsumidorFinal],
    cuit: [
      '',
      [
        Validators.minLength(11),
        Validators.maxLength(11),
        Validators.pattern(FormUtils.cuitPattern),
      ],
    ],

    // --- DIRECCIÓN ---
    street: ['', Validators.maxLength(100)],
    streetNumber: ['', Validators.maxLength(10)],
    city: ['', Validators.maxLength(100)],
    province: ['', Validators.maxLength(100)],
    postalCode: ['', Validators.maxLength(10)],
    floor: ['', Validators.maxLength(5)],
    apartment: ['', Validators.maxLength(5)],

    // --- AUDITORÍA ---
    createdAt: [{ value: '', disabled: true }],
    updatedAt: [{ value: '', disabled: true }],
    deletedAt: [{ value: '', disabled: true }],
  });

  isPending(field: string) {
    return this.formClient.get(field)?.pending;
  }

  isValid(field: string) {
    const control = this.formClient.get(field);
    return control?.valid && control?.value && !control.pristine;
  }

  get formPending() {
    return this.formClient.pending;
  }

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
    } else {
      // Configurar validadores asíncronos para creación
      this.formClient.controls.dni.addAsyncValidators(
        uniqueFieldValidator('Client', 'dni', this.http),
      );
      this.formClient.controls.username.addAsyncValidators(
        uniqueFieldValidator('Client', 'username', this.http),
      );
      this.formClient.controls.email.addAsyncValidators(
        uniqueFieldValidator('Client', 'email', this.http),
      );
      this.formClient.controls.cuit.addAsyncValidators(
        uniqueFieldValidator('Client', 'cuit', this.http),
      );
      this.formClient.get('password')?.addValidators(Validators.required);
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
          lastName: client.lastName,
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

        // Configurar validadores asíncronos para edición
        this.formClient.controls.dni.setAsyncValidators(
          uniqueFieldValidator('Client', 'dni', this.http, id),
        );
        this.formClient.controls.username.setAsyncValidators(
          uniqueFieldValidator('Client', 'username', this.http, id),
        );
        this.formClient.controls.email.setAsyncValidators(
          uniqueFieldValidator('Client', 'email', this.http, id),
        );
        this.formClient.controls.cuit.setAsyncValidators(
          uniqueFieldValidator('Client', 'cuit', this.http, id),
        );

        const formSnapshot = this.formClient.getRawValue();
        this.initialFormValue.set(JSON.stringify(formSnapshot));
      },
      error: () => {
        this.alertService.toast('Error al cargar cliente', 'error');
        this.goBack();
      },
    });
  }

  get fullName(): string {
    const name = this.formClient.get('name')?.value || '';
    const lastName = this.formClient.get('lastName')?.value || '';
    return `${name} ${lastName}`;
  }

  goBack() {
    this.location.back();
  }

  get hasRealChanges(): boolean {
    // Si estamos creando, siempre permitimos guardar (si es válido)
    if (!this.isEditMode()) return true;

    // Comparar formulario actual vs inicial
    const currentJson = JSON.stringify(this.formClient.getRawValue());
    const formHasChanges = currentJson !== this.initialFormValue();

    // Verificar cambios en la foto
    const photoHasChanges = this.photoManager?.hasChanges() ?? false;

    return formHasChanges || photoHasChanges;
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
      lastName: formValue.lastName!,
      dni: formValue.dni!,
      phone: formValue.phone!,
      username: formValue.username!,
      email: formValue.email!,
      password: formValue.password || '',
      role: UserRole.Client,

      // Campos opcionales
      cuit: formValue.cuit || undefined,
      fiscalCondition: formValue.fiscalCondition!,
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
            : res.user?.id || res.id;

          if (!userId) {
            console.error(
              'No se pudo obtener el ID del usuario para subir la foto',
              res,
            );
            return of(null);
          }

          if (this.photoManager?.hasChanges()) {
            return this.photoManager.saveChanges(userId);
          }

          return of(null);
        }),
      )
      .subscribe({
        next: () => {
          this.alertService.toast('Guardado exitosamente', 'success');
          this.router.navigate(['/admin/clients']); // Redirección al listado de clientes
        },
        error: (err) => {
          console.error(err);
          this.alertService.toast('Error al guardar (revise la foto)', 'error');
        },
      });
  }
}
