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
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-view-profile-page',
  imports: [NgIconComponent, UserAvatarComponent],
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

  ngOnInit(): void {
    this.fetchAdmin(this.authService.currentUser()!.id);
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

}
