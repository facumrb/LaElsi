import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ApiCategoriaService } from '@services/api-categoria.service';
import { IApiCategoria } from '@models/categoria.model';
import { CategoriasModalComponent } from './categorias-modal/categorias-modal.component';
import { CategoriasListComponent } from './categorias-list/categorias-list.component';
import { ReactiveFormsModule } from '@angular/forms';

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

  handleModalSave(formData: any) {
    const currentCat = this.selectedCategory();

    if (currentCat) {
      // Editar
      const updatedCat = { ...currentCat, ...formData };
      this._apiService
        .updateCategoria(currentCat.id, updatedCat)
        .subscribe(() => {
          this.loadCategorias();
          this.isModalOpen.set(false);
        });
    } else {
      // Crear
      this._apiService.addCategoria(formData).subscribe(() => {
        this.loadCategorias();
        this.isModalOpen.set(false);
      });
    }
  }

  // --- Lógica de borrado ---

  handleDelete(id: number) {
    if (confirm('¿Seguro que deseas eliminar esta categoría?')) {
      this._apiService.deleteCategoria(id).subscribe(() => {
        this.categoriasRaw.update((cats) => cats.filter((c) => c.id !== id));
      });
    }
  }
}
