import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSpeedometer2,
  bootstrapPersonGear,
  bootstrapPeople,
  bootstrapBoxSeam,
  bootstrapTags,
  bootstrapReceipt,
} from '@ng-icons/bootstrap-icons';

interface menuItems {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIconComponent, A11yModule],
  viewProviders: [
    provideIcons({
      bootstrapSpeedometer2,
      bootstrapPersonGear,
      bootstrapPeople,
      bootstrapBoxSeam,
      bootstrapTags,
      bootstrapReceipt,
    }),
  ],
  templateUrl: './sidebar.component.html',
  host: { style: 'display: contents' },
})
export class SidebarComponent {
  sidebarOpen = input.required<boolean>();
  mobileMenuOpen = input.required<boolean>();

  toggleMobileMenu = output<void>();

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
}
