import { Component, inject, signal, computed } from '@angular/core';
import { ApiCategoriaService } from '@services/api-categoria.service';
import { IApiCategoria } from '@models/categoria.model';
import { CategoriasModalComponent } from './categorias-modal/categorias-modal.component';
import { CategoriasListComponent } from './categorias-list/categorias-list.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';

@Component({
  selector: 'app-categorias-page',
  imports: [
    ReactiveFormsModule,
    CategoriasModalComponent,
    CategoriasListComponent,
  ],
  templateUrl: './categorias-page.component.html',
})
export class CategoriasPageComponent {
  private _alertService = inject(AlertService);
  private _errorService = inject(ApiErrorService);
  private _apiService = inject(ApiCategoriaService);
  private categoriasRaw = signal<IApiCategoria[]>([]);

  // Estado del modal
  isModalOpen = signal(false);
  selectedCategory = signal<IApiCategoria | null>(null);

  categorias = computed(() => this.categoriasRaw());

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

  // --- Lógica de borrado ---
  delete(id: number) {
    this._alertService.confirmDelete().then((confirmado) => {
      if (confirmado) {
        this._apiService.deleteCategoria(id).subscribe({
          next: () => {
            this.categoriasRaw.update((cats) =>
              cats.filter((c) => c.id !== id),
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
