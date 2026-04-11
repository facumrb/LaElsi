import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserSession } from '@models/auth.model';
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
} from '@ng-icons/bootstrap-icons';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-navbar-top-bar',
  imports: [
    RouterLink,
    NgIconComponent,
    SearchBarComponent,
    ClickOutsideDirective,
    UserAvatarComponent,
    LogoComponent,
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
    }),
  ],
  templateUrl: './navbar-top-bar.component.html',
})
export class NavbarTopBarComponent {
  cartCount = input<number>(0);
  currentUser = input<UserSession | null>(null);
  isLoggedIn = input<boolean>(false);
  isAdmin = input<boolean>(false);

  menuToggled = output<void>();
  logoutRequested = output<void>();

  showUserMenu = signal(false);

  toggleUserMenu(): void {
    this.showUserMenu.update((v) => !v);
  }

  handleLogout(): void {
    this.showUserMenu.set(false);
    this.logoutRequested.emit();
  }
}
