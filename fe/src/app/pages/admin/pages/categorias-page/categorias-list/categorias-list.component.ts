import { Component, input, output } from '@angular/core';
import { IApiCategoria } from '@models/categoria.model';

@Component({
  selector: 'app-categorias-list',
  imports: [],
  templateUrl: './categorias-list.component.html',
})
export class CategoriasListComponent {
  categorias = input.required<IApiCategoria[]>();
  onEdit = output<IApiCategoria>();
  onDelete = output<number>();
}
