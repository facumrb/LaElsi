// Clase abstracta 'Photo' del backend
export interface IApiBasePhoto {
  id: number;
  fileName: string; // Ej: "a1b2-c3d4-fdsf-sdfds.jpg"
  originalName: string; // Ej: "foto_playa.jpg"
  mimeType: string; // Ej: "image/jpeg"
}

// FOTO DE PRODUCTO
export interface IApiProductPhoto extends IApiBasePhoto {
  order: number; // Para ordenar las fotos del producto dentro del carrousel
  productId: number; // ID del producto al que pertenece
}

// FOTO DE USUARIO
export interface IApiUserPhoto extends IApiBasePhoto {
  userId: number; // ID del usuario dueño de la foto
}
