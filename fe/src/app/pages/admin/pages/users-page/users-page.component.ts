import { Component, inject, OnInit } from '@angular/core';
import { ApiAdminService } from '@services/api-admin.service';
import { IApiAdmin } from '@models/admin.model';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-users-page',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent implements OnInit {
  formUser!: FormGroup;
  loading: boolean = true;
  errorMessage: string = '';
  private _apiService = inject(ApiAdminService);
  users: IApiAdmin[] = [];
  isModalOpen = false;
  adminSeleccionado?: IApiAdmin;
  modalMode: 'add' | 'edit' = 'add';
  searchQuery: string = '';
  filterState: string = '';

  constructor(private formBuilder: FormBuilder) {
    this.formUser = this.formBuilder.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],
      apellido: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      user: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],
      password: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this._apiService.getAllAdmins().subscribe((data) => {
      this.users = data;
    });
  }

  openModal(mode: 'add' | 'edit', admin?: IApiAdmin): void {
    this.modalMode = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && admin) {
      this.adminSeleccionado = admin;
      this.formUser.patchValue(admin);
    } else {
      this.formUser.reset();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = '';
  }

  onSubmit(): void {
    if (this.formUser.valid) {
      const userData = {
        ...this.adminSeleccionado,
        ...this.formUser.value,
      };
      const request =
        this.modalMode === 'add'
          ? this._apiService.addAdmin(userData)
          : this._apiService.updateAdmin(userData.id, userData);

      request.subscribe(() => {
        this.loadUsers();
        this.closeModal();
      });
    }
  }

  deleteUser(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este user?')) {
      this._apiService.deleteAdmin(id).subscribe(() => {
        this.users = this.users.filter((user) => user.id !== id);
      });
    }
  }

  hasErrors(field: string, typeError: string) {
    return (
      this.formUser.get(field)?.hasError(typeError) &&
      this.formUser.get(field)?.touched
    );
  }
}
