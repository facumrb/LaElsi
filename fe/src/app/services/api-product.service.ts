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

  // Obtener todos los productos
  getAllProducts(): Observable<IApiProduct[]> {
    return this._http
      .get<{ message: string; data: IApiProduct[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  // Obtener un producto por ID
  getProductById(id: number): Observable<IApiProduct> {
    return this._http
      .get<{ message: string; data: IApiProduct }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  // Buscar productos por nombre o descripción
  searchProducts(query: string): Observable<IApiProduct[]> {
    const params = new HttpParams().set('query', query);
    return this._http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => response.data));
  }

  // Obtener productos segun una categoría
  getProductsByCategory(categoryId: number): Observable<IApiProduct[]> {
    return this._http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/category/${categoryId}`)
      .pipe(map((response) => response.data));
  }

  // Crea un nuevo producto (solo datos, las fotos se suben desde el api-photo.service)
  addProduct(product: ICreateProduct): Observable<IApiProduct> {
    return this._http
      .post<{ message: string; data: IApiProduct }>(this.apiUrl, product)
      .pipe(map((response) => response.data));
  }

  // Actualiza un producto
  updateProduct(id: number, product: ICreateProduct): Observable<IApiProduct> {
    return this._http
      .patch<{
        message: string;
        data: IApiProduct;
      }>(`${this.apiUrl}/${id}`, product)
      .pipe(map((response) => response.data));
  }

  // Elimina un producto
  deleteProduct(id: number): Observable<void> {
    return this._http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
