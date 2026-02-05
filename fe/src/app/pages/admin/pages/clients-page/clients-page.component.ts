import { Component, inject, OnInit } from '@angular/core';
import { ApiClientService } from '@services/api-client.service';
import { IApiClient } from '@models/user.model';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './clients-page.component.html',
})
export class ClientsPageComponent implements OnInit {
  private _apiService = inject(ApiClientService);
  private formBuilder = inject(FormBuilder);

  clients: IApiClient[] = [];
  isModalOpen = false;
  clientSelected?: IApiClient;
  formClient!: FormGroup;
  fiscalConditions = [
    'Consumidor Final',
    'Responsable Inscripto',
    'Monotributista',
    'Exento',
  ];

  ngOnInit(): void {
    this.loadClients();
    this.initForm();
  }

  initForm() {
    this.formClient = this.formBuilder.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}$')]],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      cuit: ['', [Validators.pattern('^[0-9]{11}$')]],
      fiscalCondition: ['Consumidor Final'],
      street: [''],
      streetNumber: [null],
      city: [''],
      province: [''],
      postalCode: [''],
    });
  }

  loadClients(): void {
    this._apiService.getAllClients().subscribe((data) => {
      this.clients = data;
    });
  }

  openModal(client?: IApiClient): void {
    this.clientSelected = client;
    this.isModalOpen = true;
    if (client) {
      this.formClient.patchValue(client);
    } else {
      this.formClient.reset({ fiscalCondition: 'Consumidor Final' });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.formClient.invalid) return;

    const data = this.formClient.value;
    const request$ = this.clientSelected
      ? this._apiService.updateClient(this.clientSelected.id, data)
      : this._apiService.addClient(data);

    request$.subscribe({
      next: () => {
        this.loadClients();
        this.closeModal();
        Swal.fire('Éxito', 'Cliente guardado correctamente', 'success');
      },
      error: (err) =>
        Swal.fire('Error', err.error?.message || 'Error al guardar', 'error'),
    });
  }

  deleteClient(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3d4494',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._apiService.deleteClient(id).subscribe(() => {
          this.clients = this.clients.filter((c) => c.id !== id);
          Swal.fire('Eliminado', 'El cliente ha sido borrado', 'success');
        });
      }
    });
  }
}
