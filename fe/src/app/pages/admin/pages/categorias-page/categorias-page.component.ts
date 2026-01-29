import { Component, inject, signal, computed } from '@angular/core';
import { ApiCategoriaService } from '@services/api-category.service';
import { IApiCategoria } from '@models/categoria.model';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';
import { CategoriasModalComponent } from './categorias-modal/categorias-modal.component';
import { CategoriasListComponent } from './categorias-list/categorias-list.component';
import { CategoriasToolbarComponent } from './categorias-toolbar/categorias-toolbar.component';
import { FiltroInventario } from './categorias-toolbar/categorias-toolbar.component';

@Component({
  selector: 'app-categorias-page',
  imports: [
    ReactiveFormsModule,
    CategoriasModalComponent,
    CategoriasListComponent,
    CategoriasToolbarComponent,
  ],
  templateUrl: './categorias-page.component.html',
})
export class CategoriasPageComponent {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiCategoriaService);
  private categoriasRaw = signal<IApiCategoria[]>([]);

  filtroEstado = signal<'Todos' | 'Activo' | 'Inactivo'>('Todos');
  filtroInventario = signal<FiltroInventario>('Todos');
  searchQuery = signal('');

  categorias = computed(() => {
    const raw = this.categoriasRaw();
    const estado = this.filtroEstado();
    const inv = this.filtroInventario();

    const query = this.searchQuery().toLowerCase().trim();

    let filtered = raw.filter((cat) => {
      // Filtro de Estado
      const cumpleEstado = estado === 'Todos' || cat.estado === estado;

      // Filtro de Inventario
      const cant = cat.items?.length || 0;
      let cumpleInv = true;
      if (inv === 'ConProductos') cumpleInv = cant > 0;
      if (inv === 'SinProductos') cumpleInv = cant === 0;

      // Filtro de Búsqueda
      const cumpleBusqueda =
        cat.nombre.toLowerCase().includes(query) ||
        (cat.descripcion && cat.descripcion.toLowerCase().includes(query));

      return cumpleEstado && cumpleInv && cumpleBusqueda;
    });
    if (inv === 'MasProductos') {
      // Ordenar de Mayor a Menor (Descendente)
      filtered = filtered.sort(
        (a, b) => (b.items?.length || 0) - (a.items?.length || 0),
      );
    } else if (inv === 'MenosProductos') {
      // Ordenar de Menor a Mayor (Ascendente)
      filtered = filtered.sort(
        (a, b) => (a.items?.length || 0) - (b.items?.length || 0),
      );
    }

    return filtered;
  });

  // Estado del modal
  isModalOpen = signal(false);
  selectedCategory = signal<IApiCategoria | null>(null);

  ngOnInit() {
    this.loadCategorias();
  }

  loadCategorias() {
    this._apiService.getAllCategorias().subscribe((data) => {
      this.categoriasRaw.set(data);
    });
  }

  // --- Lógica del Modal ---
  openAddModal() {
    this.selectedCategory.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(categoria: IApiCategoria) {
    this.selectedCategory.set(categoria);
    this.isModalOpen.set(true);
  }

  modalSubmit(formData: any) {
    const currentCat = this.selectedCategory();
    const esEdicion = !!currentCat;
    const request$ = esEdicion
      ? this._apiService.updateCategoria(currentCat.id, {
        ...currentCat,
        ...formData,
      })
      : this._apiService.addCategoria(formData);

    request$.subscribe({
      next: () => {
        this.loadCategorias();
        this.isModalOpen.set(false);
        this._alertService.toast(
          `Categoría ${esEdicion ? 'editada' : 'creada'} con éxito`,
          'success',
        );
      },
      error: (err) => {
        this._errorService.handle(
          err,
          esEdicion ? 'editar la categoría' : 'crear la categoría',
        );
      },
    });
  }

  // --- Lógica para borrar la categoria ---
  delete(categoria: IApiCategoria) {
    const cantidadProductos = categoria.items?.length || 0;
    if (cantidadProductos > 0) {
      this._alertService.error(
        'Acción Bloqueada',
        `No puedes eliminar la categoría <b>"${categoria.nombre}"</b> porque tiene <b>${cantidadProductos}</b> productos asociados.<br><br>💡 Primero elimina o mueve esos productos.`,
      );
      return;
    }

    this._alertService.confirmDelete().then((confirmado) => {
      if (confirmado) {
        this._apiService.deleteCategoria(categoria.id).subscribe({
          next: () => {
            this.categoriasRaw.update((cats) =>
              cats.filter((c) => c.id !== categoria.id),
            );
            this._alertService.toast('Categoría eliminada', 'success');
          },
          error: (err) => {
            this._errorService.handle(err, 'eliminar la categoría');
          },
        });
      }
    });
  }
}
