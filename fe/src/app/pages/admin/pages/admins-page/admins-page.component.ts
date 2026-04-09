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
import { IApiAdmin } from '@models/user.model';
import { ApiAdminService } from '@services/api-services/api-admin.service';
import { AlertService } from '@services/alert.service';
import { AdminsListComponent } from './admins-list/admins-list.component';
import { AdminsToolbarComponent } from './admins-toolbar/admins-toolbar.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admins-page',
  imports: [AdminsListComponent, AdminsToolbarComponent, PaginationComponent],
  templateUrl: './admins-page.component.html',
})
export class AdminsPageComponent implements OnInit {
  private alertService = inject(AlertService);
  private apiService = inject(ApiAdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private adminsRaw = signal<IApiAdmin[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0); // Total real del servidor, para el guard de 'único admin'

  searchQuery = signal<string>('');

  adminsFiltered = computed(() => {
    // El filtrado fuerte (búsqueda) se hace en el server.
    return [...this.adminsRaw()].sort((a, b) => a.id - b.id);
  });

  constructor() {
    // Reacciona SOLO cuando el usuario cambia la búsqueda.
    // Resetea a página 1 y recarga, sin crear loops.
    effect(() => {
      this.searchQuery(); // trackea cambios de búsqueda
      untracked(() => {
        // Evitamos actuar en la primera ejecución (ngOnInit se encarga)
        if (this.initialLoadDone) {
          this.currentPage.set(1);
          this.loadAdmins();
        }
      });
    });
  }

  private initialLoadDone = false;

  ngOnInit() {
    // Leer la página de la URL al entrar
    const pageParam = this.route.snapshot.queryParamMap.get('page');
    this.currentPage.set(Number(pageParam) || 1);
    this.loadAdmins();
    this.initialLoadDone = true;
  }

  loadAdmins() {
    const query = this.searchQuery().trim();

    if (query) {
      this.apiService.searchAdmins(query, this.currentPage()).subscribe({
        next: (data) => {
          this.adminsRaw.set(data.data);
          this.totalPages.set(data.totalPages);
          this.totalItems.set(data.total);
        },
      });
    } else {
      this.apiService.getAllAdmins(this.currentPage()).subscribe({
        next: (data) => {
          this.adminsRaw.set(data.data);
          this.totalPages.set(data.totalPages);
          this.totalItems.set(data.total);
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
    this.loadAdmins();
  }

  handleNavigateToCreate() {
    this.router.navigate(['/admin/admins/create']);
  }

  handleNavigateToEdit(admin: IApiAdmin) {
    this.router.navigate(['/admin/admins/edit', admin.id]);
  }

  handleDelete(admin: IApiAdmin) {
    // Usamos totalItems (del servidor) para no depender de los datos de la página actual
    if (this.totalItems() <= 1) {
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
            // Recargamos desde el servidor para que la paginación se recalcule
            this.loadAdmins();
          },
        });
      }
    });
  }
}
