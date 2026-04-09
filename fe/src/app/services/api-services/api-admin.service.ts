import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IApiAdmin, ICreateAdmin, IUpdateAdmin } from '@models/user.model';
import { IPaginatedResult } from '../../models/pagination.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiAdminService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admins`;

  getAllAdmins(
    page: number = 1,
    limit: number = 16,
  ): Observable<IPaginatedResult<IApiAdmin>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<{
        message: string;
        data: IPaginatedResult<IApiAdmin>;
      }>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getAdminById(id: number): Observable<IApiAdmin> {
    return this.http
      .get<{ message: string; data: IApiAdmin }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  // Buscar administradores por nombre, apellido, nombre de usuario o dni
  searchAdmins(
    query: string,
    page: number = 1,
    limit: number = 16,
  ): Observable<IPaginatedResult<IApiAdmin>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page)
      .set('limit', limit);
    return this.http
      .get<{
        message: string;
        data: IPaginatedResult<IApiAdmin>;
      }>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => response.data));
  }

  addAdmin(admin: ICreateAdmin): Observable<IApiAdmin> {
    return this.http
      .post<{ message: string; data: IApiAdmin }>(this.apiUrl, admin)
      .pipe(map((response) => response.data));
  }

  updateAdmin(id: number, admin: IUpdateAdmin): Observable<IApiAdmin> {
    return this.http
      .patch<{
        message: string;
        data: IApiAdmin;
      }>(`${this.apiUrl}/${id}`, admin)
      .pipe(map((response) => response.data));
  }

  deleteAdmin(id: number): Observable<void> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
