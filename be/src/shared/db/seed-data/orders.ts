import { OrderState } from '../../enums/state.enum.js';
import { DeliveryMethod } from '../../enums/delivery-method.enum.js';
import { PaymentMethod } from '../../enums/payment-method.enum.js';
import { IOrderSeed } from './interfaces.js';

export const ORDERS_DATA: IOrderSeed[] = [
  {
    clientUsername: 'cliente',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2025-11-10T10:30:00'),
    items: [
      { productName: 'Lápiz HB Classic', quantity: 5 },
      { productName: 'Goma de Borrar Dos Banderas', quantity: 2 }
    ]
  },
  {
    clientUsername: 'empresa',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2025-12-01T09:00:00'),
    items: [
      { productName: 'Resma A4 75g', quantity: 10 },
      { productName: 'Bolígrafos Azul x10', quantity: 3 }
    ]
  },
  {
    clientUsername: 'monotributo',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2025-12-15T14:20:00'),
    items: [
      { productName: 'Mouse Inalámbrico', quantity: 1 },
      { productName: 'Teclado Mecánico Gamer', quantity: 1 }
    ]
  },
  {
    clientUsername: 'exento',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-01-05T11:00:00'),
    items: [
      { productName: 'Cuaderno Universitario Éxito', quantity: 4 },
      { productName: 'Carpeta N3', quantity: 2 },
      { productName: 'Resaltadores Pastel x4', quantity: 1 }
    ]
  },
  {
    clientUsername: 'valen_m',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-01-18T16:45:00'),
    items: [
      { productName: 'Auriculares Bluetooth', quantity: 1 },
      { productName: 'Pendrive 64GB 3.0', quantity: 2 }
    ]
  },
  {
    clientUsername: 'rodri_ib',
    status: OrderState.Cancelled,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-01-22T08:15:00'),
    items: [
      { productName: 'Monitor 24 FHD', quantity: 1 }
    ]
  },
  {
    clientUsername: 'cami_rios',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-02-03T13:00:00'),
    items: [
      { productName: 'Muñeca Articulada', quantity: 1 },
      { productName: 'Masa para Modelar x4', quantity: 2 },
      { productName: 'Rompecabezas 1000 Piezas', quantity: 1 }
    ]
  },
  {
    clientUsername: 'mati_alv',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-02-14T10:00:00'),
    items: [
      { productName: 'Disco SSD 480GB', quantity: 2 },
      { productName: 'Cable HDMI 2m', quantity: 3 }
    ]
  },
  {
    clientUsername: 'flor_ben',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-02-28T17:30:00'),
    items: [
      { productName: 'Pelota de Fútbol N5', quantity: 1 },
      { productName: 'Auto a Control Remoto', quantity: 1 }
    ]
  },
  {
    clientUsername: 'nico_cas',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-10T12:00:00'),
    items: [
      { productName: 'Parlante Portátil', quantity: 1 },
      { productName: 'Soporte para Celular', quantity: 1 },
      { productName: 'Power Bank 10000mAh', quantity: 1 }
    ]
  },
  {
    clientUsername: 'agus_mol',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-03-20T09:30:00'),
    items: [
      { productName: 'Juego de Cartas UNO', quantity: 2 },
      { productName: 'Cubo Mágico 3x3', quantity: 1 },
      { productName: 'Mochila Espalda 18p', quantity: 1 }
    ]
  }
];
