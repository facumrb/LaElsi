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

  cartSignal = signal(0); // Esto debe estar conectado al servicio del carrito
  showSideMenu = signal(false);
  showUserMenu = signal(false);

  categories = signal<IApiCategory[]>([]);

  currentUser = this.authService.currentUser();

  readonly userImagesUrl = environment.userImagesUrl;

  // Signal computada para obtener la foto o null
  userPhotoUrl = computed(() => {
    if (this.currentUser && this.currentUser.photo?.fileName) {
      return `${this.userImagesUrl}${this.currentUser.photo.fileName}`;
    }
    return null;
  });

  // Signal computada para las iniciales
  userInitials = computed(() => {
    if (!this.currentUser) return '';
    const first = this.currentUser.name?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  });

  ngOnInit() {
    this.apiCategoryService.getActiveCategories().subscribe({
      next: (data) => this.categories.set(data),
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
