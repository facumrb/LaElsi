import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiPhotoService {
  private _http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/photos`;

  // Cargar las fotos de un producto
  uploadProductPhotos(
    productId: number,
    photosData: FormData,
  ): Observable<any> {
    return this._http.post(
      `${this.apiUrl}/upload/productPhotos/${productId}`,
      photosData,
    );
  }

  // Reordenar las fotos de un producto
  reorderProductPhotos(
    photosOrder: { id: number; order: number }[],
  ): Observable<any> {
    return this._http.post(`${this.apiUrl}/reorder`, { photosOrder });
  }

  // Borrar una foto específica de un producto
  deleteProductPhoto(photoId: number): Observable<any> {
    return this._http.delete(`${this.apiUrl}/productPhotos/${photoId}`);
  }

  // Cargar o reemplazar la foto de perfil de un usuario
  uploadUserPhoto(userId: number, photoData: FormData): Observable<any> {
    return this._http.post(
      `${this.apiUrl}/upload/userPhoto/${userId}`,
      photoData,
    );
  }

  // Borrar la foto de perfil de un usuario
  deleteUserPhoto(photoId: number): Observable<any> {
    return this._http.delete(`${this.apiUrl}/userPhoto/${photoId}`);
  }
}
