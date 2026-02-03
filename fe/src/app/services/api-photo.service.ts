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

  // Carga de imagenes
  uploadProductPhotos(
    productId: number,
    photosData: FormData,
  ): Observable<any> {
    return this._http.post(
      `${this.apiUrl}/upload/productPhotos/${productId}`,
      photosData,
    );
  }

  // Reordenar imagenes
  reorderProductPhotos(
    photosOrder: { id: number; order: number }[],
  ): Observable<any> {
    return this._http.post(`${this.apiUrl}/reorder`, { photosOrder });
  }

  // Borrar una foto específica
  deleteProductPhoto(photoId: number): Observable<any> {
    return this._http.delete(`${this.apiUrl}/productPhotos/${photoId}`);
  }
}
