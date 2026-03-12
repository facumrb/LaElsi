import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  IApiProduct,
  ICreateProduct,
  IUpdateProduct,
} from '@models/product.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiProductService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  // Obtener todos los productos
  getAllProducts(): Observable<IApiProduct[]> {
    return this.http
      .get<{ message: string; data: IApiProduct[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  // Obtener todos los productos activos
  getActiveProducts(): Observable<IApiProduct[]> {
    return this.http
      .get<{ message: string; data: IApiProduct[] }>(`${this.apiUrl}/active`)
      .pipe(map((response) => response.data));
  }

  // Obtener productos con paginación
  getProductsPage(
    page: number = 1,
    limit: number = 10,
  ): Observable<{
    products: IApiProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<{
        message: string;
        data: {
          products: IApiProduct[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`${this.apiUrl}/page`, { params })
      .pipe(map((response) => response.data));
  }

  // Obtener un producto por ID
  getProductById(id: number): Observable<IApiProduct> {
    return this.http
      .get<{ message: string; data: IApiProduct }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  // Buscar productos por nombre o descripción
  searchProducts(query: string): Observable<IApiProduct[]> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => response.data));
  }

  // Obtener productos segun una categoría (todos)
  getProductsByCategory(categoryId: number): Observable<IApiProduct[]> {
    return this.http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/category/${categoryId}`)
      .pipe(map((response) => response.data));
  }

  // Obtener productos activos segun una categoría
  getActiveProductsByCategory(categoryId: number): Observable<IApiProduct[]> {
    return this.http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/active/category/${categoryId}`)
      .pipe(map((response) => response.data));
  }

  // Crea un nuevo producto (solo datos, las fotos se suben desde el api-photo.service)
  addProduct(product: ICreateProduct): Observable<IApiProduct> {
    return this.http
      .post<{ message: string; data: IApiProduct }>(this.apiUrl, product)
      .pipe(map((response) => response.data));
  }

  // Actualiza un producto
  updateProduct(id: number, product: IUpdateProduct): Observable<IApiProduct> {
    return this.http
      .patch<{
        message: string;
        data: IApiProduct;
      }>(`${this.apiUrl}/${id}`, product)
      .pipe(map((response) => response.data));
  }

  // Elimina un producto
  deleteProduct(id: number): Observable<void> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  // Bulk operations
  previewBulkPriceChange(
    productIds: number[],
    adjustmentType: string,
    adjustmentValue: number,
    roundingRule?: string,
  ): Observable<any[]> {
    return this.http
      .post<{
        message: string;
        data: any[];
      }>(`${this.apiUrl}/bulk/preview`, {
        productIds,
        adjustmentType,
        adjustmentValue,
        roundingRule,
      })
      .pipe(map((res) => res.data));
  }

  applyBulkPriceChange(
    productIds: number[],
    adjustmentType: string,
    adjustmentValue: number,
    roundingRule?: string,
  ): Observable<any> {
    return this.http
      .post<{
        message: string;
        data: any;
      }>(`${this.apiUrl}/bulk/apply`, {
        productIds,
        adjustmentType,
        adjustmentValue,
        roundingRule,
      })
      .pipe(map((res) => res.data));
  }

  rollbackBulkPriceChange(batchId: number): Observable<void> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/bulk/rollback/${batchId}`, {})
      .pipe(map(() => void 0));
  }

  getBulkHistory(): Observable<any[]> {
    return this.http
      .get<{ message: string; data: any[] }>(`${this.apiUrl}/bulk/history`)
      .pipe(map((res) => res.data));
  }

  // Obtener los más vendidos
  getBestSellers(limit: number = 10): Observable<IApiProduct[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/best-sellers`, { params })
      .pipe(map((response) => response.data));
  }

  // Obtener los más vendidos por categoría
  getBestSellersByCategory(
    categoryId: number,
    limit: number = 10,
  ): Observable<IApiProduct[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http
      .get<{
        message: string;
        data: IApiProduct[];
      }>(`${this.apiUrl}/best-sellers/category/${categoryId}`, { params })
      .pipe(map((response) => response.data));
  }
}
