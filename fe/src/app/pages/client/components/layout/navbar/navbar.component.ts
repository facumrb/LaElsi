import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IApiCategory } from '@models/category.model';
import { ApiCategoryService } from '@services/api-category.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  userSignal = signal('Iniciar Sesion');
  carritoSignal = signal(0);

  private ApiCategoryService = inject(ApiCategoryService);
  categorias: IApiCategory[] = [];

  ngOnInit() {
    this.ApiCategoryService.getAllCategories().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('Error al traer categorías', err),
    });
  }
}
