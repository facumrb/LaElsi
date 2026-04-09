import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IPaginatedResult } from '../../models/pagination.model';
import {
  IApiOrder,
  ICreateOrder,
  OrderState,
  DeliveryMethod,
} from '@models/order.model';

@Injectable({
  providedIn: 'root',
})
export class ApiOrderService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  getAllOrders(
    page: number = 1,
    limit: number = 10,
    filters: {
      query?: string;
      status?: string;
      deliveryMethod?: string;
      paymentMethod?: string;
    } = {},
  ): Observable<IPaginatedResult<IApiOrder>> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (filters.query) params = params.set('query', filters.query);
    if (filters.status && filters.status !== 'Todos')
      params = params.set('status', filters.status);
    if (filters.deliveryMethod && filters.deliveryMethod !== 'Todos')
      params = params.set('deliveryMethod', filters.deliveryMethod);
    if (filters.paymentMethod && filters.paymentMethod !== 'Todos')
      params = params.set('paymentMethod', filters.paymentMethod);

    return this.http
      .get<{
        message: string;
        data: IPaginatedResult<IApiOrder>;
      }>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getOrderById(id: number): Observable<IApiOrder> {
    return this.http
      .get<{ message: string; data: IApiOrder }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  getOrdersByClient(
    clientId: number,
    page: number = 1,
    limit: number = 10,
  ): Observable<IPaginatedResult<IApiOrder>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<{
        message: string;
        data: IPaginatedResult<IApiOrder>;
      }>(`${this.apiUrl}/client/${clientId}`, { params })
      .pipe(map((response) => response.data));
  }

  createOrder(order: ICreateOrder): Observable<IApiOrder> {
    return this.http
      .post<{ message: string; data: IApiOrder }>(this.apiUrl, order)
      .pipe(map((response) => response.data));
  }

  updateStatus(id: number, status: OrderState): Observable<IApiOrder> {
    return this.http
      .patch<{ message: string; data: IApiOrder }>(
        `${this.apiUrl}/${id}/status`,
        {
          status,
        },
      )
      .pipe(map((response) => response.data));
  }

  updateDeliveryMethod(
    id: number,
    deliveryMethod: DeliveryMethod,
  ): Observable<IApiOrder> {
    return this.http
      .patch<{
        message: string;
        data: IApiOrder;
      }>(`${this.apiUrl}/${id}/delivery-method`, { deliveryMethod })
      .pipe(map((response) => response.data));
  }

  cancelOrder(id: number): Observable<IApiOrder> {
    return this.http
      .patch<{
        message: string;
        data: IApiOrder;
      }>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(map((response) => response.data));
  }
}
