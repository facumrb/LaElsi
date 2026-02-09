import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IApiCategory } from '@models/category.model';
import { ApiCategoryService } from '@services/api-category.service';
import { AuthService } from '@services/auth.service';
import { ClickOutsideDirective } from '@shared/click-outside.directive';
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
  bootstrapBoxArrowRight,
  bootstrapSpeedometer2,
  bootstrapPerson,
} from '@ng-icons/bootstrap-icons';
import { SearchBarComponent } from './search-bar/search-bar.component';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIconComponent,
    SearchBarComponent,
    ClickOutsideDirective,
  ],
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
      bootstrapBoxArrowRight,
      bootstrapSpeedometer2,
      bootstrapPerson,
    }),
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private apiCategoryService = inject(ApiCategoryService);

  carritoSignal = signal(0); // Esto debe estar conectado al servicio del carrito
  showSideMenu = signal(false);
  showUserMenu = signal(false);

  categories: IApiCategory[] = [];

  ngOnInit() {
    this.apiCategoryService.getAllCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Error al traer categorías', err),
    });
  }

  toggleMobileMenu() {
    this.showSideMenu.update((v) => !v);
  }

  toggleUserMenu() {
    this.showUserMenu.update((v) => !v);
  }

  handleLogout() {
    this.authService.logout();
    this.showUserMenu.set(false);
    this.showSideMenu.set(false); // Cerrar menú móvil si es que estaba abierto
  }
}
