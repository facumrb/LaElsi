import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiItemService } from '@services/api-item.service';
import { ApiCategoriaService } from '@services/api-categoria.service';
import { ItemCardComponent } from '@cliente/components/item-card/item-card.component';
import { IApiCategoria } from '@models/categoria.model';
import { IApiItem } from '@models/item.model';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [ItemCardComponent],
  templateUrl: './category-page.component.html',
})
export class CategoryPageComponent implements OnInit {
  categoria?: IApiCategoria; // Guardamos el objeto completo aquí
  items: IApiItem[] = [];

  private ApiCategoriaService = inject(ApiCategoriaService);
  private ApiItemService = inject(ApiItemService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.cargarDatosDePagina(id);
    });
  }

  cargarDatosDePagina(id: number) {
    // 1. Llamamos a tu función para obtener el nombre de la categoría
    this.ApiCategoriaService.getCategoriaById(id).subscribe({
      next: (data) => (this.categoria = data),
      error: (err) => console.error('Error al obtener categoría', err),
    });

    // 2. Llamamos a la función que ya teníamos para los productos
    this.ApiItemService.getItemsByCategory(id).subscribe({
      next: (data) => (this.items = data),
      error: (err) => console.error('Error al obtener productos', err),
    });
  }
}
