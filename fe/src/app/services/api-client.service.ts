import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IApiClient, ICreateClient, IUpdateClient } from '@models/user.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private _http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clients`;

  getAllClients(): Observable<IApiClient[]> {
    return this._http
      .get<{ message: string; data: IApiClient[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  getClientById(id: number): Observable<IApiClient> {
    return this._http
      .get<{ message: string; data: IApiClient }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  addClient(client: ICreateClient): Observable<IApiClient> {
    return this._http
      .post<{ message: string; data: IApiClient }>(this.apiUrl, client)
      .pipe(map((response) => response.data));
  }

  updateClient(id: number, client: IUpdateClient): Observable<IApiClient> {
    return this._http
      .patch<{
        message: string;
        data: IApiClient;
      }>(`${this.apiUrl}/${id}`, client)
      .pipe(map((response) => response.data));
  }

  deleteClient(id: number): Observable<void> {
    return this._http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
