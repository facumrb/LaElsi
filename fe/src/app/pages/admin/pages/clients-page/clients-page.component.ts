import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
    // El filtrado se hace server-side (búsqueda + condición fiscal).
    return [...this.clientsRaw()].sort((a, b) => a.id - b.id);
  });

  constructor() {
    // Reacciona cuando el usuario cambia la búsqueda o el filtro fiscal.
    // Ambos filtros se aplican server-side con paginación correcta.
    effect(() => {
      this.searchQuery();
      this.fiscalFilter();
      untracked(() => {
        if (this.initialLoadDone) {
          this.currentPage.set(1);
          this.loadClients();
        }
      });
    });
  }

  private initialLoadDone = false;

  ngOnInit() {
    const pageParam = this.route.snapshot.queryParamMap.get('page');
    this.currentPage.set(Number(pageParam) || 1);
    this.loadClients();
    this.initialLoadDone = true;
  }

  loadClients() {
    const query = this.searchQuery().trim();
    const fiscal = this.fiscalFilter();

    // Si hay búsqueda, usamos el endpoint de search
    if (query) {
      this.apiService.searchClients(query, this.currentPage()).subscribe({
        next: (data) => {
          this.clientsRaw.set(data.data);
          this.totalPages.set(data.totalPages);
        },
      });
    } else {
      // Usamos getAll con el filtro fiscal (server-side)
      this.apiService.getAllClients(this.currentPage(), 16, fiscal).subscribe({
        next: (data) => {
          this.clientsRaw.set(data.data);
          this.totalPages.set(data.totalPages);
        },
      });
    }
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
    this.loadClients();
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
            // Recargamos desde el servidor para que la paginación se recalcule
            this.loadClients();
          },
        });
      }
    });
  }
}
