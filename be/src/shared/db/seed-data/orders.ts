import { OrderState } from '../../enums/state.enum.js';
import { DeliveryMethod } from '../../enums/delivery-method.enum.js';
import { PaymentMethod } from '../../enums/payment-method.enum.js';
import { IOrderSeed } from './interfaces.js';

export const ORDERS_DATA: IOrderSeed[] = [
  // ── cliente (17 órdenes) ──────────────────────────────────────────
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
    clientUsername: 'cliente',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2025-11-25T14:00:00'),
    items: [
      { productName: 'Resma A4 75g', quantity: 3 },
      { productName: 'Carpeta N3', quantity: 2 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2025-12-05T09:15:00'),
    items: [{ productName: 'Cuaderno Universitario Éxito', quantity: 3 }]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2025-12-20T11:30:00'),
    items: [
      { productName: 'Mouse Inalámbrico', quantity: 1 },
      { productName: 'Pendrive 64GB 3.0', quantity: 1 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-01-08T16:00:00'),
    items: [
      { productName: 'Resaltadores Pastel x4', quantity: 2 },
      { productName: 'Bolígrafos Azul x10', quantity: 1 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-01-20T10:00:00'),
    items: [{ productName: 'Mochila Espalda 18p', quantity: 1 }]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-01-30T13:45:00'),
    items: [
      { productName: 'Tijera Escolar', quantity: 2 },
      { productName: 'Adhesivo Sintético 30ml', quantity: 3 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-02-05T09:30:00'),
    items: [
      { productName: 'Teclado Mecánico Gamer', quantity: 1 },
      { productName: 'Cable HDMI 2m', quantity: 2 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-02-14T15:20:00'),
    items: [
      { productName: 'Auriculares Bluetooth', quantity: 1 },
      { productName: 'Soporte para Celular', quantity: 1 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-02-22T11:00:00'),
    items: [{ productName: 'Parlante Portátil', quantity: 1 }]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-03-01T08:00:00'),
    items: [
      { productName: 'Juego de Cartas UNO', quantity: 3 },
      { productName: 'Cubo Mágico 3x3', quantity: 2 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-10T17:30:00'),
    items: [{ productName: 'Power Bank 10000mAh', quantity: 2 }]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-18T12:45:00'),
    items: [
      { productName: 'Rompecabezas 1000 Piezas', quantity: 1 },
      { productName: 'Jenga de Madera', quantity: 1 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Cancelled,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-22T09:00:00'),
    items: [{ productName: 'Disco SSD 480GB', quantity: 1 }]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Cancelled,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-03-28T14:10:00'),
    items: [{ productName: 'Abrochadora Mediana', quantity: 2 }]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-04-02T10:00:00'),
    items: [
      { productName: 'Lápiz HB Classic', quantity: 10 },
      { productName: 'Goma de Borrar Dos Banderas', quantity: 5 },
      { productName: 'Cuaderno Universitario Éxito', quantity: 2 }
    ]
  },
  {
    clientUsername: 'cliente',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-04-08T16:30:00'),
    items: [
      { productName: 'Smartwatch Band 7', quantity: 1 },
      { productName: 'Funda Notebook 15.6', quantity: 1 }
    ]
  },

  // ── empresa (6 órdenes) ───────────────────────────────────────────
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
    clientUsername: 'empresa',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-01-15T10:30:00'),
    items: [
      { productName: 'Resma A4 75g', quantity: 20 },
      { productName: 'Carpeta N3', quantity: 10 }
    ]
  },
  {
    clientUsername: 'empresa',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-02-10T08:30:00'),
    items: [
      { productName: 'Abrochadora Mediana', quantity: 5 },
      { productName: 'Adhesivo Sintético 30ml', quantity: 10 }
    ]
  },
  {
    clientUsername: 'empresa',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-05T11:00:00'),
    items: [
      { productName: 'Resma A4 75g', quantity: 15 },
      { productName: 'Lápiz HB Classic', quantity: 50 }
    ]
  },
  {
    clientUsername: 'empresa',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-25T09:00:00'),
    items: [
      { productName: 'Cuaderno Universitario Éxito', quantity: 20 },
      { productName: 'Resaltadores Pastel x4', quantity: 10 }
    ]
  },
  {
    clientUsername: 'empresa',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-04-05T14:00:00'),
    items: [
      { productName: 'Bolígrafos Azul x10', quantity: 5 },
      { productName: 'Tijera Escolar', quantity: 10 }
    ]
  },

  // ── monotributo ───────────────────────────────────────────────────
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
    clientUsername: 'monotributo',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-01-28T10:00:00'),
    items: [{ productName: 'Disco SSD 480GB', quantity: 1 }]
  },
  {
    clientUsername: 'monotributo',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-15T16:00:00'),
    items: [
      { productName: 'Monitor 24 FHD', quantity: 1 },
      { productName: 'Cable HDMI 2m', quantity: 1 }
    ]
  },

  // ── exento ────────────────────────────────────────────────────────
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
    clientUsername: 'exento',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-02-20T09:30:00'),
    items: [{ productName: 'Bloques de Construcción', quantity: 3 }]
  },

  // ── valen_m (5 órdenes) ───────────────────────────────────────────
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
    clientUsername: 'valen_m',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-02-08T13:00:00'),
    items: [{ productName: 'Muñeca Articulada', quantity: 1 }]
  },
  {
    clientUsername: 'valen_m',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-02T10:30:00'),
    items: [
      { productName: 'Pelota de Fútbol N5', quantity: 1 },
      { productName: 'Juego de Cartas UNO', quantity: 2 }
    ]
  },
  {
    clientUsername: 'valen_m',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-20T15:00:00'),
    items: [
      { productName: 'Masa para Modelar x4', quantity: 3 },
      { productName: 'Set de Cocina', quantity: 1 }
    ]
  },
  {
    clientUsername: 'valen_m',
    status: OrderState.Cancelled,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-04-01T11:00:00'),
    items: [{ productName: 'Parlante Portátil', quantity: 1 }]
  },

  // ── rodri_ib ──────────────────────────────────────────────────────
  {
    clientUsername: 'rodri_ib',
    status: OrderState.Cancelled,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-01-22T08:15:00'),
    items: [{ productName: 'Monitor 24 FHD', quantity: 1 }]
  },
  {
    clientUsername: 'rodri_ib',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-02-18T12:00:00'),
    items: [
      { productName: 'Power Bank 10000mAh', quantity: 1 },
      { productName: 'Cable HDMI 2m', quantity: 1 }
    ]
  },

  // ── cami_rios ─────────────────────────────────────────────────────
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
    clientUsername: 'cami_rios',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-08T09:45:00'),
    items: [
      { productName: 'Cubo Mágico 3x3', quantity: 1 },
      { productName: 'Trompo Luminoso', quantity: 2 }
    ]
  },

  // ── mati_alv ──────────────────────────────────────────────────────
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
    clientUsername: 'mati_alv',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-12T14:30:00'),
    items: [{ productName: 'Teclado Mecánico Gamer', quantity: 1 }]
  },

  // ── flor_ben ──────────────────────────────────────────────────────
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
    clientUsername: 'flor_ben',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2025-12-10T11:00:00'),
    items: [{ productName: 'Pistola de Agua', quantity: 2 }]
  },

  // ── nico_cas ──────────────────────────────────────────────────────
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
    clientUsername: 'nico_cas',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-04-03T09:00:00'),
    items: [
      { productName: 'Mouse Inalámbrico', quantity: 1 },
      { productName: 'Funda Notebook 15.6', quantity: 1 }
    ]
  },

  // ── agus_mol ──────────────────────────────────────────────────────
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
  },
  {
    clientUsername: 'agus_mol',
    status: OrderState.Cancelled,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-04-06T16:00:00'),
    items: [{ productName: 'Smartwatch Band 7', quantity: 1 }]
  },

  // ── adriel_g ──────────────────────────────────────────────────────
  {
    clientUsername: 'adriel_g',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-01-12T10:00:00'),
    items: [
      { productName: 'Lápiz HB Classic', quantity: 3 },
      { productName: 'Cuaderno Universitario Éxito', quantity: 1 }
    ]
  },
  {
    clientUsername: 'adriel_g',
    status: OrderState.Pending,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-04-07T13:30:00'),
    items: [{ productName: 'Auto a Control Remoto', quantity: 1 }]
  },

  // ── belen_l ───────────────────────────────────────────────────────
  {
    clientUsername: 'belen_l',
    status: OrderState.Delivered,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-02-25T15:00:00'),
    items: [
      { productName: 'Juego de Mesa Estanciero', quantity: 1 },
      { productName: 'Bloques de Construcción', quantity: 1 }
    ]
  },

  // ── cris_s ────────────────────────────────────────────────────────
  {
    clientUsername: 'cris_s',
    status: OrderState.Paid,
    deliveryMethod: DeliveryMethod.RetiroSucursal,
    paymentMethod: PaymentMethod.Local,
    dateTime: new Date('2026-03-14T11:15:00'),
    items: [
      { productName: 'Pista de Autos', quantity: 1 },
      { productName: 'Yo-Yo Profesional', quantity: 2 }
    ]
  },

  // ── dani_v ────────────────────────────────────────────────────────
  {
    clientUsername: 'dani_v',
    status: OrderState.Shipped,
    deliveryMethod: DeliveryMethod.Envio,
    paymentMethod: PaymentMethod.Transferencia,
    dateTime: new Date('2026-03-30T08:45:00'),
    items: [
      { productName: 'Agenda 2025', quantity: 1 },
      { productName: 'Cartuchera 2 Pisos', quantity: 1 },
      { productName: 'Resaltadores Pastel x4', quantity: 2 }
    ]
  }
];
