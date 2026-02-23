import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAdminService } from '@services/api-admin.service';
import { IApiAdmin } from '@models/user.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowLeft,
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
      bootstrapArrowLeft,
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
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _apiService = inject(ApiAdminService);
  private _errorService = inject(ApiErrorService);

  loading = signal(true);
  admin = signal<IApiAdmin | null>(null);
  imageBaseUrl = environment.userImagesUrl;

  ngOnInit(): void {
    const adminId = this._route.snapshot.paramMap.get('id');
    if (adminId) {
      this.fetchAdmin(+adminId);
    }
  }

  private fetchAdmin(id: number): void {
    this._apiService.getAdminById(id).subscribe({
      next: (data: IApiAdmin) => {
        this.admin.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this._errorService.handle(err, 'cargar el perfil');
      },
    });
  }

  goBack(): void {
    this._router.navigate(['/admin/dashboard']);
  }

  editarPerfil(): void {
    this._router.navigate(['/admin/edit-profile', this.admin()?.id]);
  }
}
