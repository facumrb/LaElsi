import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IApiCategory } from '@models/category.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiCategoryService {
  private _http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  // Obtener todas las categorías
  getAllCategories(): Observable<IApiCategory[]> {
    return this._http
      .get<{ message: string; data: IApiCategory[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  // Obtener una categoría por ID
  getCategoryById(id: number): Observable<IApiCategory> {
    return this._http
      .get<{ message: string; data: IApiCategory }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  // Buscar categorías por nombre o descripción
  searchCategories(query: string): Observable<IApiCategory[]> {
    const params = new HttpParams().set('query', query);
    return this._http
      .get<{
        message: string;
        data: IApiCategory[];
      }>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => response.data));
  }

  // Crea una nueva categoría
  addCategory(category: IApiCategory): Observable<IApiCategory> {
    return this._http
      .post<{
        message: string;
        data: IApiCategory;
      }>(this.apiUrl, category)
      .pipe(map((response) => response.data));
  }

  // Actualiza una categoría
  updateCategory(id: number, category: IApiCategory): Observable<IApiCategory> {
    return this._http
      .patch<{
        message: string;
        data: IApiCategory;
      }>(`${this.apiUrl}/${id}`, category)
      .pipe(map((response) => response.data));
  }

  // Elimina una categoría
  deleteCategory(id: number): Observable<void> {
    return this._http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
