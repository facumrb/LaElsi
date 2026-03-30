import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSpeedometer2, // Icono de Dashboard
  bootstrapPersonGear, // Icono de Administradores
  bootstrapPeople, // Icono de Clientes
  bootstrapBoxSeam, // Icono de Productos
  bootstrapTags, // Icono de Categorías
  bootstrapReceipt, // Icono de Pedidos
  bootstrapList, // Icono de Menú hamburguesa
  bootstrapBoxArrowRight, // Icono de logout
  bootstrapPerson, // Icono de perfil
  bootstrapShop, // Icono para ir al eccomerce
  bootstrapChevronDown,
} from '@ng-icons/bootstrap-icons';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

interface menuItems {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ClickOutsideDirective,
    NgIconComponent,
    UserAvatarComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapSpeedometer2,
      bootstrapPersonGear,
      bootstrapPeople,
      bootstrapBoxSeam,
      bootstrapTags,
      bootstrapReceipt,
      bootstrapList,
      bootstrapBoxArrowRight,
      bootstrapPerson,
      bootstrapShop,
      bootstrapChevronDown,
    }),
  ],
  templateUrl: './layout.component.html',
  styles: `
    .nowrap {
      white-space: nowrap;
    }
  `,
})
export class LayoutComponent {
  private authService = inject(AuthService);

  sidebarOpen = signal(true);
  mobileMenuOpen = signal(false);
  showUserMenu = signal(false);

  currentUser = this.authService.currentUser;


  menuItems: menuItems[] = [
    {
      label: 'Analíticas',
      route: '/admin/analytics',
      icon: 'bootstrapSpeedometer2',
    },
    {
      label: 'Administradores',
      route: '/admin/admins',
      icon: 'bootstrapPersonGear',
    },
    {
      label: 'Clientes',
      route: '/admin/clients',
      icon: 'bootstrapPeople',
    },
    {
      label: 'Categorías',
      route: '/admin/categories',
      icon: 'bootstrapTags',
    },
    {
      label: 'Productos',
      route: '/admin/products',
      icon: 'bootstrapBoxSeam',
    },
    {
      label: 'Pedidos',
      route: '/admin/orders',
      icon: 'bootstrapReceipt',
    },
  ];

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  toggleUserMenu() {
    this.showUserMenu.update((v) => !v);
  }

  // Metodo para Cerrar Sesión
  handleLogout() {
    this.showUserMenu.set(false);
    this.authService.logout();
  }
}
