import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ApiCategoriaService } from 'src/app/services/api-categoria.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],

  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  userSignal = signal('Iniciar Sesion');
  carritoSignal = signal(0);

  categorias: any[] = [];

  constructor(private ApiCategoriaService: ApiCategoriaService) {}

  ngOnInit() {
    this.ApiCategoriaService.getAllCategorias().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('Error al traer categorías', err),
    });
  }
}
