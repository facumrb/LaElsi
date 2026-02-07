import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IApiAdmin } from '@models/user.model';
import { ApiAdminService } from '@services/api-admin.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { AdminsListComponent } from './admins-list/admins-list.component';
import { AdminsToolbarComponent } from './admins-toolbar/admins-toolbar.component';

@Component({
  selector: 'app-admins-page',
  standalone: true,
  imports: [AdminsListComponent, AdminsToolbarComponent],
  templateUrl: './admins-page.component.html',
})
export class AdminsPageComponent implements OnInit {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiAdminService);
  private _router = inject(Router);

  private adminsRaw = signal<IApiAdmin[]>([]);

  // Por ahora solo devuelve la lista ordenada por ID, pero aquí podríamos agregar filtros, paginación, etc.
  adminsFiltered = computed(() => {
    const admins = this.adminsRaw();
    return admins.sort((a, b) => a.id - b.id);
  });

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    this._apiService.getAllAdmins().subscribe({
      next: (data) => {
        this.adminsRaw.set(data);
      },
      error: (err) => {
        this._errorService.handle(err, 'cargar los administradores');
      },
    });
  }

  handleNavigateToCreate() {
    this._router.navigate(['/admin/admins/create']);
  }

  handleNavigateToEdit(admin: IApiAdmin) {
    this._router.navigate(['/admin/admins/edit', admin.id]);
  }

  handleDelete(admin: IApiAdmin) {
    this._alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this._apiService.deleteAdmin(admin.id).subscribe({
          next: () => {
            this._alertService.toast('Administrador eliminado', 'success');
            this.adminsRaw.update((current) =>
              current.filter((a) => a.id !== admin.id),
            );
          },
          error: (err) => {
            this._errorService.handle(err, 'eliminar el administrador');
          },
        });
      }
    });
  }
}
