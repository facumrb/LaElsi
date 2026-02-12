import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IApiClient } from '@models/user.model';
import { ApiClientService } from '@services/api-client.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { ClientsToolbarComponent } from './clients-toolbar/clients-toolbar.component';
import { ClientsListComponent } from './clients-list/clients-list.component';

@Component({
  selector: 'app-clients-page',
  imports: [ClientsListComponent, ClientsToolbarComponent],
  templateUrl: './clients-page.component.html',
})
export class ClientsPageComponent implements OnInit {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiClientService);
  private _router = inject(Router);

  private clientsRaw = signal<IApiClient[]>([]);

  searchQuery = signal<string>('');

  clientsFiltered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const clients = this.clientsRaw();

    // Filtrado de la barra de busqueda
    const filtered = clients.filter((client) => {
      // Si no hay búsqueda, devolvemos todo
      if (!query) return true;

      // Buscamos por nombre, apellido, username o dni
      return (
        client.name.toLowerCase().includes(query) ||
        client.last_name.toLowerCase().includes(query) ||
        client.username.toLowerCase().includes(query) ||
        client.dni.includes(query)
      );
    });

    return filtered.sort((a, b) => a.id - b.id);
  });

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this._apiService.getAllClients().subscribe({
      next: (data) => {
        this.clientsRaw.set(data);
      },
      error: (err) => {
        this._errorService.handle(err, 'cargar los clientes');
      },
    });
  }

  handleNavigateToCreate() {
    this._router.navigate(['/admin/clients/create']);
  }

  handleNavigateToEdit(client: IApiClient) {
    this._router.navigate(['/admin/clients/edit', client.id]);
  }

  handleDelete(client: IApiClient) {
    this._alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this._apiService.deleteClient(client.id).subscribe({
          next: () => {
            this._alertService.toast('Cliente eliminado', 'success');
            this.clientsRaw.update((current) =>
              current.filter((a) => a.id !== client.id),
            );
          },
          error: (err) => {
            this._errorService.handle(err, 'eliminar el cliente');
          },
        });
      }
    });
  }
}
