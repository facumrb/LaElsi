import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ClickOutsideDirective } from '@shared/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSpeedometer2, // Dashboard
  bootstrapPersonGear, // Usuarios admins
  bootstrapPeople, // Clientes
  bootstrapBoxSeam, // Productos
  bootstrapTags, // Categorías
  bootstrapReceipt, // Pedidos
  bootstrapList, // Menú hamburguesa
} from '@ng-icons/bootstrap-icons';

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
  private _authService = inject(AuthService);
  private _router = inject(Router);

  sidebarOpen = signal(true);
  mobileMenuOpen = signal(false);
  showUserMenu = signal(false);

  currentUser = signal<{ id: number; name: string; role: string } | null>(null);

  menuItems: menuItems[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
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

  ngOnInit() {
    // Recuperar usuario del LocalStorage
    const user = this._authService.getUser();
    if (user) {
      this.currentUser.set(user);
    } else {
      // Si no hay usuario, forzamos salida
      this._router.navigate(['/']);
    }
  }

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
    this._authService.logout();
    this.showUserMenu.set(false);
    this._router.navigate(['/']);
  }
}
