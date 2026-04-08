import { Component, inject, OnInit, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxSeam,
  bootstrapShieldLock,
  bootstrapFilePerson,
} from '@ng-icons/bootstrap-icons';
import { ApiClientService } from '@services/api-services/api-client.service';
import { ApiOrderService } from '@services/api-services/api-order.service';
import { AuthService } from '@services/auth.service';
import { IApiClient } from '@models/user.model';
import { IApiOrder } from '@models/order.model';
import { environment } from 'src/environments/environment';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-profile-page',
  imports: [NgIconComponent, RouterOutlet, RouterLink, RouterLinkActive],
  viewProviders: [
    provideIcons({
      bootstrapBoxSeam,
      bootstrapShieldLock,
      bootstrapFilePerson,
    }),
  ],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  private authService = inject(AuthService);
  private apiClientService = inject(ApiClientService);
  private apiOrderService = inject(ApiOrderService);

  loading = signal(true);
  misPedidos = signal<IApiOrder[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  productImagesUrl = environment.productImagesUrl;

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentUserSignal = this.authService.currentUser;
  fullProfile = signal<IApiClient | null>(null);

  ngOnInit(): void {
    const userSummary = this.currentUserSignal();

    this.route.queryParamMap.subscribe((queryParams) => {
      const page = Number(queryParams.get('page')) || 1;
      this.currentPage.set(page);
      if (userSummary) {
        this.loadOrders(userSummary.id);
      }
    });

    if (userSummary) {
      this.loadFullProfile(userSummary.id);
    } else {
      this.loading.set(false);
    }
  }

  loadFullProfile(id: number = this.currentUserSignal()?.id || 0) {
    if (!id) return;

    this.apiClientService.getAccountInfoById(id).subscribe({
      next: (fullUser) => {
        this.fullProfile.set(fullUser);
        this.authService.updateCurrentUser(fullUser);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });

    this.loadOrders(id);
  }

  loadOrders(id: number) {
    this.apiOrderService.getOrdersByClient(id, this.currentPage()).subscribe({
      next: (data) => {
        this.misPedidos.set(data.data);
        this.totalPages.set(data.totalPages);
      },
    });
  }

  onActivate(componentRef: any) {
    if (componentRef.profile) {
      componentRef.profile = this.fullProfile;
    }
    if (componentRef.orders) {
      componentRef.orders = this.misPedidos;
      if (componentRef.currentPage) {
        componentRef.currentPage = this.currentPage;
        componentRef.totalPages = this.totalPages;
        componentRef.pageChange.subscribe((page: number) => {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: page },
            queryParamsHandling: 'merge',
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
    if (componentRef.profileUpdated) {
      componentRef.profileUpdated.subscribe(() => {
        this.loadFullProfile();
      });
    }
    this.loading.set(false);
  }
}
