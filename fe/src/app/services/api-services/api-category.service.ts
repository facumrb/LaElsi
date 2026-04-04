import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  IApiCategory,
  ICreateCategory,
  IUpdateCategory,
} from '@models/category.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiCategoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  // Obtener todas las categorías
  getAllCategories(): Observable<IApiCategory[]> {
    return this.http
      .get<{ message: string; data: IApiCategory[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  // Obtener todas las categorías ACTIVAS
  getActiveCategories(): Observable<IApiCategory[]> {
    return this.http
      .get<{ message: string; data: IApiCategory[] }>(`${this.apiUrl}/active`)
      .pipe(map((response) => response.data));
  }

  // Obtener una categoría por ID
  getCategoryById(id: number): Observable<IApiCategory> {
    return this.http
      .get<{ message: string; data: IApiCategory }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  // Buscar categorías por nombre o descripción
  searchCategories(query: string): Observable<IApiCategory[]> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<{
        message: string;
        data: IApiCategory[];
      }>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => response.data));
  }

  // Crea una nueva categoría
  addCategory(category: ICreateCategory): Observable<IApiCategory> {
    return this.http
      .post<{
        message: string;
        data: IApiCategory;
      }>(this.apiUrl, category)
      .pipe(map((response) => response.data));
  }

  // Actualiza una categoría
  updateCategory(
    id: number,
    category: IUpdateCategory,
  ): Observable<IApiCategory> {
    return this.http
      .patch<{
        message: string;
        data: IApiCategory;
      }>(`${this.apiUrl}/${id}`, category)
      .pipe(map((response) => response.data));
  }

  // Elimina una categoría
  deleteCategory(id: number): Observable<void> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  // Obtener el árbol de categorías
  getCategoryTree(state?: string): Observable<IApiCategory[]> {
    let params = {};
    if (state) {
      params = { state };
    }

    return this.http
      .get<{ message: string; data: IApiCategory[] }>(`${this.apiUrl}/tree`, {
        params,
      })
      .pipe(map((response) => response.data));
  }

  // Obtener subcategorías de una categoría
  getCategoryChildren(id: number): Observable<IApiCategory[]> {
    return this.http
      .get<{
        message: string;
        data: IApiCategory[];
      }>(`${this.apiUrl}/${id}/children`)
      .pipe(map((response) => response.data));
  }

  // Actualizar el orden de las categorias en lote
  updateCategoryOrders(
    updates: { id: number; order: number; parentId: number | null }[],
  ): Observable<void> {
    return this.http
      .patch<{ message: string }>(`${this.apiUrl}/reorder`, { updates })
      .pipe(map(() => void 0));
  }
}
