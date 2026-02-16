import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiAdminService } from '@services/api-admin.service';
import { IApiAdmin } from '@models/user.model';

@Component({
  selector: 'app-view-profile-page',
  templateUrl: './view-profile-page.component.html',
  styleUrl: './view-profile-page.component.css',
})
export class ViewProfilePageComponent implements OnInit {
  loading: boolean = true;
  admin?: IApiAdmin;
  errorMessage: string = '';

  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _apiService = inject(ApiAdminService);

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      const adminId = params['id'];
      this.fetchAdmin(adminId);
    });
  }

  private fetchAdmin(id: number): void {
    this._apiService.getAdminById(id).subscribe({
      next: (data: IApiAdmin) => {
        this.admin = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        // Manejo de errores según el código de estado.
        if (error.status >= 500) {
          this.errorMessage =
            'Error del servidor. Por favor, intenta más tarde.';
        } else {
          this.errorMessage =
            'Ocurrió un error inesperado. Inténtalo más tarde.';
        }
      },
    });
  }

  volverAtras(): void {
    this._router.navigate(['/admin/home']);
  }

  editarPerfil(): void {
    this._router.navigate(['/admin/edit-profile', this.admin?.id]);
  }
}
