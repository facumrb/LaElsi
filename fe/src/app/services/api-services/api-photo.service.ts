import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IApiResponse } from '@models/auth.model';
import { IApiProductPhoto, IApiUserPhoto } from '@models/photo.model';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiPhotoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/photos`;

  // Cargar las fotos de un producto
  uploadProductPhotos(
    productId: number,
    photosData: FormData,
  ): Observable<IApiProductPhoto[]> {
    return this.http
      .post<
        IApiResponse<IApiProductPhoto[]>
      >(`${this.apiUrl}/upload/productPhotos/${productId}`, photosData)
      .pipe(map((response) => response.data));
  }

  // Reordenar las fotos de un producto
  reorderProductPhotos(
    photosOrder: { id: number; order: number }[],
  ): Observable<void> {
    return this.http
      .post<IApiResponse<null>>(`${this.apiUrl}/reorder`, { photosOrder })
      .pipe(map(() => void 0));
  }

  // Borrar una foto específica de un producto
  deleteProductPhoto(photoId: number): Observable<void> {
    return this.http
      .delete<IApiResponse<null>>(`${this.apiUrl}/productPhotos/${photoId}`)
      .pipe(map(() => void 0));
  }

  // Cargar o reemplazar la foto de perfil de un usuario
  uploadUserPhoto(
    userId: number,
    photoData: FormData,
  ): Observable<IApiUserPhoto> {
    return this.http
      .post<
        IApiResponse<IApiUserPhoto>
      >(`${this.apiUrl}/upload/userPhoto/${userId}`, photoData)
      .pipe(map((response) => response.data));
  }

  // Borrar la foto de perfil de un usuario
  deleteUserPhoto(photoId: number): Observable<void> {
    return this.http
      .delete<IApiResponse<null>>(`${this.apiUrl}/userPhoto/${photoId}`)
      .pipe(map(() => void 0));
  }
}
