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
  uploadPhotos(productId: number, photosData: FormData): Observable<any> {
    return this._http.post(`${this.apiUrl}/upload/${productId}`, photosData);
  }

  // Reordenar imagenes
  reorderPhotos(photosOrder: { id: number; order: number }[]): Observable<any> {
    return this._http.post(`${this.apiUrl}/reorder`, { photosOrder });
  }

  // Borrar una foto específica
  deletePhoto(photoId: number): Observable<any> {
    return this._http.delete(`${this.apiUrl}/${photoId}`);
  }
}
