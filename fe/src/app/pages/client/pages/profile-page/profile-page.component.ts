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
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
  productImagesUrl = environment.productImagesUrl;

  currentUserSignal = this.authService.currentUser;
  fullProfile = signal<IApiClient | null>(null);

  ngOnInit(): void {
    const userSummary = this.currentUserSignal();

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
      error: (err) => {
        this.loading.set(false);
        console.error(err);
      },
    });

    this.apiOrderService.getOrdersByClient(id).subscribe({
      next: (orders) => this.misPedidos.set(orders),
      error: (err) => console.error('Error al cargar pedidos', err),
    });
  }

  onActivate(componentRef: any) {
    if (componentRef.profile) {
      componentRef.profile = this.fullProfile;
    }
    if (componentRef.orders) {
      componentRef.orders = this.misPedidos;
    }
    if (componentRef.profileUpdated) {
      componentRef.profileUpdated.subscribe(() => {
        this.loadFullProfile();
      });
    }
    this.loading.set(false);
  }
}
