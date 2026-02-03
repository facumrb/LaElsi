// Clase abstracta 'Photo' del backend
export interface IApiBasePhoto {
  id: number;
  fileName: string; // Ej: "a1b2-c3d4-fdsf-sdfds.jpg" (Lo que guardaste con UUID)
  originalName: string; // Ej: "foto_playa.jpg"
  mimeType: string; // Ej: "image/jpeg"
}

// FOTO DE PRODUCTO (Extiende la base + sus cosas únicas)
export interface IApiProductPhoto extends IApiBasePhoto {
  order: number; // Para ordenar las fotos del producto dentro del carrousel
  productId: number; // ID del producto al que pertenece
}

// FOTO DE USUARIO (Extiende la base + sus cosas únicas)
export interface IApiUserPhoto extends IApiBasePhoto {
  userId: number; // ID del usuario dueño de la foto
}
