import { Component, inject, OnInit } from '@angular/core';
import { ApiAdministradorService } from '../../../services/api-administrador.service';
import { IApiAdmin } from '../../../models/admin.model';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: '../home/home.component.css',
})
export class UsuariosComponent implements OnInit {
  formUsuario!: FormGroup;
  loading: boolean = true;
  errorMessage: string = '';
  private _apiService = inject(ApiAdministradorService);
  usuarios: IApiAdmin[] = [];
  isModalOpen = false;
  administradorSeleccionado?: IApiAdmin;
  modalMode: 'add' | 'edit' = 'add';
  searchQuery: string = '';
  filterState: string = '';

  constructor(private formBuilder: FormBuilder) {
    this.formUsuario = this.formBuilder.group({
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
      usuario: [
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
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this._apiService.getAllAdmins().subscribe((data) => {
      this.usuarios = data;
    });
  }

  openModal(mode: 'add' | 'edit', administrador?: IApiAdmin): void {
    this.modalMode = mode;
    this.isModalOpen = true;
    if (mode === 'edit' && administrador) {
      this.administradorSeleccionado = administrador;
      this.formUsuario.patchValue(administrador);
    } else {
      this.formUsuario.reset();
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = 'hidden';
  }

  onSubmit(): void {
    if (this.formUsuario.valid) {
      const usuarioData = {
        ...this.administradorSeleccionado,
        ...this.formUsuario.value,
      };
      const request =
        this.modalMode === 'add'
          ? this._apiService.addAdmin(usuarioData)
          : this._apiService.updateAdmin(usuarioData.id, usuarioData);

      request.subscribe(() => {
        this.loadUsuarios();
        this.closeModal();
      });
    }
  }

  deleteUsuario(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      this._apiService.deleteAdmin(id).subscribe(() => {
        this.usuarios = this.usuarios.filter((usuario) => usuario.id !== id);
      });
    }
  }

  hasErrors(field: string, typeError: string) {
    return (
      this.formUsuario.get(field)?.hasError(typeError) &&
      this.formUsuario.get(field)?.touched
    );
  }
}
