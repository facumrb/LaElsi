import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IApiAdmin } from '@models/user.model';
import { ApiAdminService } from '@services/api-admin.service';
import { AlertService } from '@shared/alert.service';
import { AdminsListComponent } from './admins-list/admins-list.component';
import { AdminsToolbarComponent } from './admins-toolbar/admins-toolbar.component';

@Component({
  selector: 'app-admins-page',
  imports: [AdminsListComponent, AdminsToolbarComponent],
  templateUrl: './admins-page.component.html',
})
export class AdminsPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private apiService = inject(ApiAdminService);
  private router = inject(Router);

  private adminsRaw = signal<IApiAdmin[]>([]);

  searchQuery = signal<string>('');

  adminsFiltered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const admins = this.adminsRaw();

    // Filtrado de la barra de busqueda
    const filtered = admins.filter((admin) => {
      // Si no hay búsqueda, devolvemos todo
      if (!query) return true;

      // Buscamos por nombre, apellido, username o dni
      return (
        admin.name.toLowerCase().includes(query) ||
        admin.lastName.toLowerCase().includes(query) ||
        admin.username.toLowerCase().includes(query) ||
        admin.dni.includes(query)
      );
    });

    return filtered.sort((a, b) => a.id - b.id);
  });

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    this.apiService.getAllAdmins().subscribe({
      next: (data) => {
        this.adminsRaw.set(data);
      },
    });
  }

  handleNavigateToCreate() {
    this.router.navigate(['/admin/admins/create']);
  }

  handleNavigateToEdit(admin: IApiAdmin) {
    this.router.navigate(['/admin/admins/edit', admin.id]);
  }

  handleDelete(admin: IApiAdmin) {
    // Si la cantidad de admins es 1 o menos, no permitimos borrar.
    if (this.adminsRaw().length <= 1) {
      this.alertService.toast(
        'No puedes eliminar al único administrador del sistema',
        'error',
      );
      return;
    }

    this.alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this.apiService.deleteAdmin(admin.id).subscribe({
          next: () => {
            this.alertService.toast('Administrador eliminado', 'success');
            this.adminsRaw.update((current) =>
              current.filter((a) => a.id !== admin.id),
            );
          },
        });
      }
    });
  }
}
