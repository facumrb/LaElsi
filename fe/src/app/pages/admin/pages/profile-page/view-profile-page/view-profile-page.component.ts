import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiAdminService } from '@services/api-admin.service';
import { AuthService } from '@services/auth.service';
import { IApiAdmin } from '@models/user.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapEnvelope,
  bootstrapPersonVcard,
  bootstrapPencil,
  bootstrapPerson,
  bootstrapPhone,
  bootstrapShieldCheck,
} from '@ng-icons/bootstrap-icons';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-view-profile-page',
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapEnvelope,
      bootstrapPersonVcard,
      bootstrapPencil,
      bootstrapPerson,
      bootstrapPhone,
      bootstrapShieldCheck,
    }),
  ],
  templateUrl: './view-profile-page.component.html',
})
export class ViewProfilePageComponent implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiAdminService);
  private authService = inject(AuthService);

  admin = signal<IApiAdmin | null>(null);
  imageBaseUrl = environment.userImagesUrl;

  ngOnInit(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.fetchAdmin(userId);
    }
  }

  private fetchAdmin(id: number): void {
    this.apiService.getAdminById(id).subscribe({
      next: (data: IApiAdmin) => {
        this.admin.set(data);
      },
    });
  }

  editarPerfil(): void {
    this.router.navigate(['/admin/edit-profile']);
  }

  getInitials(): string {
    const admin = this.admin();
    if (!admin) return '';
    const first = admin.name?.charAt(0) || '';
    const last = admin.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}
