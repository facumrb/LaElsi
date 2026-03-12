import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAdminService } from '@services/api-admin.service';
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
import { ApiErrorService } from '@shared/api-error.service';

@Component({
  selector: 'app-view-profile-page',
  standalone: true,
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
  private routeActive = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiAdminService);
  private errorService = inject(ApiErrorService);

  loading = signal(true);
  admin = signal<IApiAdmin | null>(null);
  imageBaseUrl = environment.userImagesUrl;

  ngOnInit(): void {
    const adminId = this.routeActive.snapshot.paramMap.get('id');
    if (adminId) {
      this.fetchAdmin(+adminId);
    }
  }

  private fetchAdmin(id: number): void {
    this.apiService.getAdminById(id).subscribe({
      next: (data: IApiAdmin) => {
        this.admin.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorService.handle(err, 'cargar el perfil');
      },
    });
  }

  editarPerfil(): void {
    this.router.navigate(['/admin/edit-profile', this.admin()?.id]);
  }

  getInitials(): string {
    const admin = this.admin();
    if (!admin) return '';
    const first = admin.name?.charAt(0) || '';
    const last = admin.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}
