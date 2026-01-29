import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IApiAdmin } from '@models/admin.model';
import { IApiAccountInfo } from '@models/accountInfo.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiAdminService {
  private _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/admins`;

  getAllAdmins(): Observable<IApiAdmin[]> {
    return this._http
      .get<{ message: string; data: IApiAdmin[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  getAdmin(id: number): Observable<IApiAccountInfo> {
    return this._http
      .get<{
        message: string;
        data: IApiAccountInfo;
      }>(`${this.apiUrl}/account/${id}`)
      .pipe(map((response) => response.data));
  }

  getAdminById(id: number): Observable<IApiAdmin> {
    return this._http
      .get<{ message: string; data: IApiAdmin }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  addAdmin(admin: IApiAdmin): Observable<IApiAdmin> {
    return this._http
      .post<{ message: string; data: IApiAdmin }>(this.apiUrl, admin)
      .pipe(map((response) => response.data));
  }

  updateAdmin(id: number, admin: IApiAccountInfo): Observable<IApiAccountInfo> {
    return this._http
      .patch<{
        message: string;
        data: IApiAccountInfo;
      }>(`${this.apiUrl}/${id}`, admin)
      .pipe(map((response) => response.data));
  }

  deleteAdmin(id: number): Observable<void> {
    return this._http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
