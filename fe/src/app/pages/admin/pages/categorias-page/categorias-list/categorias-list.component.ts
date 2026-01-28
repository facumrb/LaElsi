import { Component, input, output } from '@angular/core';
import { IApiCategoria } from '@models/categoria.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categorias-list',
  imports: [],
  templateUrl: './categorias-list.component.html',
})
export class CategoriasListComponent {
  categorias = input.required<IApiCategoria[]>();
  onEdit = output<IApiCategoria>();
  onDelete = output<IApiCategoria>();

  verProductos(categoria: IApiCategoria) {
    if (!categoria.items || categoria.items.length === 0) return;

    const listaHtml = categoria.items
      .map((item) => `<li class="mb-1"><b>${item.nombre}</b></li>`)
      .join('');

    Swal.fire({
      title: `Productos en ${categoria.nombre}`,
      html: `
      <ol class="list-decimal text-left pl-6 space-y-2 mt-4 text-sm text-gray-700 max-h-60 overflow-y-auto border border-gray-200 p-4 rounded-md">
        ${listaHtml}
      </ol>
    `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3d4494',
      width: '400px',
    });
  }
}
