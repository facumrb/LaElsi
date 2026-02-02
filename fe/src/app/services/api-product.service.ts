import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IApiProduct, ICreateProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiProductService {
  private _http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  getAllProducts(): Observable<IApiProduct[]> {
    return this._http
      .get<{ message: string; data: IApiProduct[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  getProductById(id: number): Observable<IApiProduct> {
    return this._http
      .get<{ message: string; data: IApiProduct }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  searchProducts(query: string): Observable<IApiProduct[]> {
    const params = new HttpParams().set('query', query);
    return this._http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => response.data));
  }

  getProductsByCategory(categoryName: string): Observable<IApiProduct[]> {
    return this._http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/category/${categoryName}`)
      .pipe(map((response) => response.data));
  }

  // PASO 1: Envía JSON
  addProduct(product: ICreateProduct): Observable<IApiProduct> {
    return this._http
      .post<{ message: string; data: IApiProduct }>(this.apiUrl, product)
      .pipe(map((response) => response.data));
  }

  // PASO 2: Envía FormData (Fotos)
  uploadPhotos(productId: number, photosData: FormData): Observable<any> {
    return this._http.post(`${this.apiUrl}/${productId}/photos`, photosData);
  }

  reorderPhotos(photosOrder: { id: number; order: number }[]): Observable<any> {
    return this._http.post(`${this.apiUrl}/photos/reorder`, { photosOrder });
  }

  // Método para borrar una foto específica
  deletePhoto(photoId: number): Observable<any> {
    return this._http.delete(`${this.apiUrl}/photos/${photoId}`);
  }

  updateProduct(id: number, product: ICreateProduct): Observable<IApiProduct> {
    return this._http
      .patch<{
        message: string;
        data: IApiProduct;
      }>(`${this.apiUrl}/${id}`, product)
      .pipe(map((response) => response.data));
  }

  deleteProduct(id: number): Observable<void> {
    return this._http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
