import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IApiCategory } from '@models/category.model';
import { ApiCategoryService } from '@services/api-category.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSearch,
  bootstrapPersonCircle,
  bootstrapCart3,
  bootstrapList,
  bootstrapX,
  bootstrapPrinter,
  bootstrapPalette,
  bootstrapPostageFill,
  bootstrapChevronRight,
} from '@ng-icons/bootstrap-icons';
import { SearchBarComponent } from './search-bar/search-bar.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIconComponent, SearchBarComponent],
  viewProviders: [
    provideIcons({
      bootstrapSearch,
      bootstrapPersonCircle,
      bootstrapCart3,
      bootstrapList,
      bootstrapX,
      bootstrapPrinter,
      bootstrapPalette,
      bootstrapPostageFill,
      bootstrapChevronRight,
    }),
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  userSignal = signal('Iniciar Sesion');
  carritoSignal = signal(0);

  private ApiCategoryService = inject(ApiCategoryService);
  categories: IApiCategory[] = [];

  showSideMenu = signal(false);

  toggleMobileMenu() {
    console.log('Estado previo:', this.showSideMenu());
    this.showSideMenu.update(v => !v);
    console.log('Estado nuevo:', this.showSideMenu());
  }

  ngOnInit() {
    this.ApiCategoryService.getAllCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Error al traer categorías', err),
    });
  }

 
}
