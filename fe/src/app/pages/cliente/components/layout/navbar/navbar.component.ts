import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IApiCategoria } from '@models/categoria.model';
import { ApiCategoriaService } from '@services/api-category.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  userSignal = signal('Iniciar Sesion');
  carritoSignal = signal(0);

  private ApiCategoriaService = inject(ApiCategoriaService);
  categorias: IApiCategoria[] = [];

  ngOnInit() {
    this.ApiCategoriaService.getAllCategorias().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('Error al traer categorías', err),
    });
  }
}
