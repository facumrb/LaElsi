import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IApiCategory } from '@models/category.model';
import { ApiCategoryService } from '@services/api-category.service';
import { AuthService } from '@services/auth.service';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapPersonCircle,
  bootstrapCart3,
  bootstrapList,
  bootstrapChevronDown,
  bootstrapBoxArrowRight,
  bootstrapSpeedometer2,
  bootstrapPerson,
  bootstrapGear,
} from '@ng-icons/bootstrap-icons';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { environment } from 'src/environments/environment';
import { CartService } from '@services/cart.service';

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
      bootstrapPersonCircle,
      bootstrapCart3,
      bootstrapList,
      bootstrapChevronDown,
      bootstrapBoxArrowRight,
      bootstrapSpeedometer2,
      bootstrapPerson,
      bootstrapGear,
    }),
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private apiCategoryService = inject(ApiCategoryService);
  private cartService = inject(CartService);

  cartSignal = this.cartService.totalItems; // Señal conectada directamente al total de items en el carrito
  showSideMenu = signal(false);
  showUserMenu = signal(false);

  categories = signal<IApiCategory[]>([]);

  currentUser = this.authService.currentUser;

  readonly userImagesUrl = environment.userImagesUrl;

  // Signal computada para obtener la foto o null
  userPhotoUrl = computed(() => {
    const user = this.currentUser();
    if (user && user.photo?.fileName) {
      return `${this.userImagesUrl}${user.photo.fileName}`;
    }
    return null;
  });

  // Signal computada para las iniciales
  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const first = user.name?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  });

  ngOnInit() {
    this.apiCategoryService.getCategoryTree('Activo').subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Error al traer árbol de categorías', err),
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
