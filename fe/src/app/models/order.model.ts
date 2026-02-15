// ==========================================================
// ENUMS
// ==========================================================

export enum OrderState {
  PENDING = 'Pendiente',
  PAID = 'Pagado',
  SHIPPED = 'Enviado',
  DELIVERED = 'Entregado',
  CANCELLED = 'Cancelado',
}

export enum DeliveryMethod {
  ENVIO = 'Envío',
  RETIRO_SUCURSAL = 'Retiro en sucursal',
}

// ==========================================================
// MODELOS DE LECTURA (READ / GET)
// ==========================================================

export interface IApiOrderLine {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    brand: string;
  };
}

export interface IApiOrder {
  id: number;
  status: OrderState;
  deliveryMethod: DeliveryMethod;
  totalAmount: number;
  dateTime: string;
  client: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: IApiOrderLine[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================================
// MODELOS DE CREACIÓN (CREATE / POST)
// ==========================================================

export interface ICreateOrderItem {
  productId: number;
  quantity: number;
}

export interface ICreateOrder {
  clientId: number;
  deliveryMethod?: DeliveryMethod;
  items: ICreateOrderItem[];
}

// ==========================================================
// MODELOS DE ACTUALIZACIÓN (UPDATE / PATCH)
// ==========================================================

export interface IUpdateOrderStatus {
  status: OrderState;
}

export interface IUpdateDeliveryMethod {
  deliveryMethod: DeliveryMethod;
}
