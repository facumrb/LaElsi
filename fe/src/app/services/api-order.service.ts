import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
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

  getAllOrders(): Observable<IApiOrder[]> {
    return this.http
      .get<{ message: string; data: IApiOrder[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  getOrderById(id: number): Observable<IApiOrder> {
    return this.http
      .get<{ message: string; data: IApiOrder }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  getOrdersByClient(clientId: number): Observable<IApiOrder[]> {
    return this.http
      .get<{
        message: string;
        data: IApiOrder[];
      }>(`${this.apiUrl}/client/${clientId}`)
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
