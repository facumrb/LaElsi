import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IApiCategory } from '@models/category.model';
import { ApiCategoryService } from '@services/api-category.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSearch,
  bootstrapPersonCircle,
  bootstrapCart3,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapSearch,
      bootstrapPersonCircle,
      bootstrapCart3,
    }),
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  userSignal = signal('Iniciar Sesion');
  carritoSignal = signal(0);

  private ApiCategoryService = inject(ApiCategoryService);
  categories: IApiCategory[] = [];

  ngOnInit() {
    this.ApiCategoryService.getAllCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Error al traer categorías', err),
    });
  }
}
