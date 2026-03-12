import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IApiClient } from '@models/user.model';
import { ApiClientService } from '@services/api-client.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import {
  ClientsToolbarComponent,
  FiscalConditionFilter,
} from './clients-toolbar/clients-toolbar.component';
import { ClientsListComponent } from './clients-list/clients-list.component';

@Component({
  selector: 'app-clients-page',
  imports: [ClientsListComponent, ClientsToolbarComponent],
  templateUrl: './clients-page.component.html',
})
export class ClientsPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private errorService = inject(ApiErrorService);
  private apiService = inject(ApiClientService);
  private router = inject(Router);

  private clientsRaw = signal<IApiClient[]>([]);

  searchQuery = signal<string>('');
  fiscalFilter = signal<FiscalConditionFilter>('Todos');

  filtersActive = computed(() => {
    return this.searchQuery() !== '' || this.fiscalFilter() !== 'Todos';
  });

  clientsFiltered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const fiscalContext = this.fiscalFilter();
    const clients = this.clientsRaw();

    const filtered = clients.filter((client) => {
      // Filtro de la barra de Búsqueda
      let matchesSearch = true;
      if (query) {
        matchesSearch =
          client.name.toLowerCase().includes(query) ||
          client.lastName.toLowerCase().includes(query) ||
          client.username.toLowerCase().includes(query) ||
          client.dni.includes(query);
      }

      // Filtro de Condicion Fiscal
      const clientFiscal = client.fiscalCondition || 'Consumidor Final';
      const matchesFiscal =
        fiscalContext === 'Todos' || clientFiscal === fiscalContext;

      return matchesSearch && matchesFiscal;
    });

    return filtered.sort((a, b) => a.id - b.id);
  });

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.apiService.getAllClients().subscribe({
      next: (data) => {
        this.clientsRaw.set(data);
      },
      error: (err) => {
        this.errorService.handle(err, 'cargar los clientes');
      },
    });
  }

  handleNavigateToCreate() {
    this.router.navigate(['/admin/clients/create']);
  }

  handleNavigateToEdit(client: IApiClient) {
    this.router.navigate(['/admin/clients/edit', client.id]);
  }

  handleDelete(client: IApiClient) {
    this.alertService.confirmDelete().then((confirm) => {
      if (confirm) {
        this.apiService.deleteClient(client.id).subscribe({
          next: () => {
            this.alertService.toast('Cliente eliminado', 'success');
            this.clientsRaw.update((current) =>
              current.filter((a) => a.id !== client.id),
            );
          },
          error: (err) => {
            this.errorService.handle(err, 'eliminar el cliente');
          },
        });
      }
    });
  }
}
