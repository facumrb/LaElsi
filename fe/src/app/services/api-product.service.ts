import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IApiProduct } from '@models/product.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiProductService {
  private _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/products`;

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

  getProductsByCategory(categoryId: number): Observable<IApiProduct[]> {
    return this._http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/category/${categoryId}`)
      .pipe(map((response) => response.data));
  }

  addProduct(product: IApiProduct): Observable<IApiProduct> {
    return this._http
      .post<{ message: string; data: IApiProduct }>(this.apiUrl, product)
      .pipe(map((response) => response.data));
  }

  updateProduct(
    id: number,
    product: Partial<IApiProduct>,
  ): Observable<IApiProduct> {
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
