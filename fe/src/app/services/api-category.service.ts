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
  private readonly apiUrl = `${environment.baseUrl}/categories`;

  getAllCategories(): Observable<IApiCategory[]> {
    return this._http
      .get<{ message: string; data: IApiCategory[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  getCategoryByName(name: string): Observable<IApiCategory> {
    return this._http
      .get<{ message: string; data: IApiCategory }>(`${this.apiUrl}/${name}`)
      .pipe(map((response) => response.data));
  }

  searchCategories(query: string): Observable<IApiCategory[]> {
    const params = new HttpParams().set('query', query);
    return this._http
      .get<{
        message: string;
        data: IApiCategory[];
      }>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => response.data));
  }

  addCategory(category: IApiCategory): Observable<IApiCategory> {
    return this._http
      .post<{
        message: string;
        data: IApiCategory;
      }>(this.apiUrl, category)
      .pipe(map((response) => response.data));
  }

  updateCategory(
    name: string,
    category: IApiCategory,
  ): Observable<IApiCategory> {
    return this._http
      .patch<{
        message: string;
        data: IApiCategory;
      }>(`${this.apiUrl}/${name}`, category)
      .pipe(map((response) => response.data));
  }

  deleteCategory(name: string): Observable<void> {
    return this._http
      .delete<{ message: string }>(`${this.apiUrl}/${name}`)
      .pipe(map(() => void 0));
  }
}
