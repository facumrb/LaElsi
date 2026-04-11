import { Component, effect, input, model, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { IApiCategory } from '@models/category.model';
import { UserSession } from '@models/auth.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSpeedometer2,
  bootstrapPerson,
  bootstrapBoxArrowRight,
} from '@ng-icons/bootstrap-icons';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { NavbarAccordionItemComponent } from '../navbar-accordion-item/navbar-accordion-item.component';

@Component({
  selector: 'app-navbar-mobile-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIconComponent,
    LogoComponent,
    NavbarAccordionItemComponent,
    A11yModule,
  ],
  viewProviders: [
    provideIcons({
      bootstrapSpeedometer2,
      bootstrapPerson,
      bootstrapBoxArrowRight,
    }),
  ],
  templateUrl: './navbar-mobile-sidebar.component.html',
})
export class NavbarMobileSidebarComponent {
  categories = input.required<IApiCategory[]>();
  activeCategoryIds = input.required<Set<number>>();
  currentUser = input<UserSession | null>(null);
  isLoggedIn = input<boolean>(false);
  isAdmin = input<boolean>(false);
  isOpen = model<boolean>(false);

  logoutRequested = output<void>();

  constructor() {
    effect((onCleanup) => {
      if (typeof document !== 'undefined') {
        if (this.isOpen()) {
          document.body.classList.add('overflow-hidden');
        } else {
          document.body.classList.remove('overflow-hidden');
        }

        onCleanup(() => {
          document.body.classList.remove('overflow-hidden');
        });
      }
    });
  }

  close(): void {
    this.isOpen.set(false);
  }

  handleLogout(): void {
    this.close();
    this.logoutRequested.emit();
  }
}
