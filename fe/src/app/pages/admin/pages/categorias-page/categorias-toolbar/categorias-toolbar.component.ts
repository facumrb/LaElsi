import { Component, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type FiltroInventario =
  | 'Todos'
  | 'ConProductos'
  | 'SinProductos'
  | 'MasProductos'
  | 'MenosProductos';

@Component({
  selector: 'app-categorias-toolbar',
  imports: [FormsModule],
  templateUrl: './categorias-toolbar.component.html',
})
export class CategoriasToolbarComponent {
  filterEstado = model.required<'Todos' | 'Activo' | 'Inactivo'>();
  filterInventario = model.required<FiltroInventario>();
  searchQuery = model.required<string>();

  // 2. OUTPUT: Para avisar que hicieron clic en "Agregar"
  onAdd = output<void>();

  showMenu = false;

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  hayFiltrosActivos() {
    return (
      this.filterEstado() !== 'Todos' || this.filterInventario() !== 'Todos'
    );
  }

  limpiar() {
    this.filterEstado.set('Todos');
    this.filterInventario.set('Todos');
    this.searchQuery.set('');
    this.showMenu = false;
  }
}
