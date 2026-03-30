import { Component, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapList,
  bootstrapBoxArrowRight,
  bootstrapPerson,
  bootstrapShop,
  bootstrapChevronDown,
} from '@ng-icons/bootstrap-icons';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    ClickOutsideDirective,
    NgIconComponent,
    UserAvatarComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapList,
      bootstrapBoxArrowRight,
      bootstrapPerson,
      bootstrapShop,
      bootstrapChevronDown,
    }),
  ],
  templateUrl: './navbar.component.html',
  host: { style: 'display: contents' },
})
export class NavbarComponent {
  private authService = inject(AuthService);

  showUserMenu = signal(false);
  currentUser = this.authService.currentUser;

  toggleMobileMenu = output<void>();
  toggleSidebar = output<void>();

  toggleUserMenu() {
    this.showUserMenu.update((v) => !v);
  }

  handleLogout() {
    this.showUserMenu.set(false);
    this.authService.logout();
  }
}
