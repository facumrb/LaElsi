import { OrderState, ProductState } from '../../enums/state.enum.js';
import { DeliveryMethod } from '../../enums/delivery-method.enum.js';
import { PaymentMethod } from '../../enums/payment-method.enum.js';

export interface IOrderLineSeed {
  productName: string;
  quantity: number;
}

export interface IOrderSeed {
  clientUsername: string;
  status: OrderState;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  dateTime: Date;
  items: IOrderLineSeed[];
}

export interface IProductSeed {
  name: string;
  description: string;
  brand: string;
  stock: number;
  categoryName: string;
  price: number;
  totalSold?: number;
  photos: { fileName: string }[];
  state?: ProductState;
}
