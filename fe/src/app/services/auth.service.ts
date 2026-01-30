import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { IApiAccountInfo } from '@models/accountInfo.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/admins`;

  login(user: string, password: string): Observable<IApiAccountInfo> {
    return this._http
      .post<{ message: string; data: IApiAccountInfo }>(
        `${this.apiUrl}/login`,
        {
          user,
          password,
        },
      )
      .pipe(map((response) => response.data));
  }
}
