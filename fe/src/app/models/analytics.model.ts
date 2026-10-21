import { IApiOrder } from './order.model';
import { IApiProductPhoto } from './photo.model';

// Producto del ranking de más vendidos del panel de analíticas
export interface IBestSellingProduct {
  id: number;
  name: string;
  totalSold: number;
  category: { id: number; name: string };
  photos: Pick<IApiProductPhoto, 'id' | 'fileName'>[]; // Solo la primera foto de la galería
}

// Respuesta de GET /analytics/summary: el servidor ya la entrega calculada
export interface IAnalyticsSummary {
  totalRevenue: number; // Suma de las órdenes pagadas, enviadas y entregadas
  totalOrders: number;
  totalClients: number;
  totalProducts: number;
  recentOrders: IApiOrder[];
  bestSellingProducts: IBestSellingProduct[];
}
