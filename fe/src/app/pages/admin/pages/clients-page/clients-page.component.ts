import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { effect } from '@angular/core';
import { IApiClient } from '@models/user.model';
import { ApiClientService } from '@services/api-services/api-client.service';
import { AlertService } from '@services/alert.service';
import {
  ClientsToolbarComponent,
  FiscalConditionFilter,
} from './clients-toolbar/clients-toolbar.component';
import { ClientsListComponent } from './clients-list/clients-list.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  selector: 'app-clients-page',
  imports: [ClientsListComponent, ClientsToolbarComponent, PaginationComponent],
  templateUrl: './clients-page.component.html',
})
export class ClientsPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private apiService = inject(ApiClientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private clientsRaw = signal<IApiClient[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  searchQuery = signal<string>('');
  fiscalFilter = signal<FiscalConditionFilter>('Todos');

  filtersActive = computed(() => {
    return this.searchQuery() !== '' || this.fiscalFilter() !== 'Todos';
  });

  clientsFiltered = computed(() => {
    // El filtrado fuerte (búsqueda) se hace en el server.
    // Aquí solo ordenamos o mostramos lo que trajo el server.
    return [...this.clientsRaw()].sort((a, b) => a.id - b.id);
  });

  constructor() {
    effect(() => {
      this.searchQuery();
      this.fiscalFilter();
      this.onFilterChange();
    });
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.currentPage.set(Number(params.get('page')) || 1);
      this.loadClients();
    });
  }

  onFilterChange() {
    if (this.currentPage() !== 1) {
      this.onPageChange(1);
    } else {
      this.loadClients();
    }
  }

  loadClients() {
    const query = this.searchQuery().trim();
    
    // Si hay búsqueda, usamos el endpoint de search
    if (query) {
      this.apiService.searchClients(query, this.currentPage()).subscribe({
        next: (data) => {
          this.clientsRaw.set(data.data);
          this.totalPages.set(data.totalPages);
        },
      });
    } else {
      // Si no hay búsqueda, usamos getAll normal
      this.apiService.getAllClients(this.currentPage()).subscribe({
        next: (data) => {
          this.clientsRaw.set(data.data);
          this.totalPages.set(data.totalPages);
        },
      });
    }
  }

  onPageChange(page: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        });
      }
    });
  }
}
