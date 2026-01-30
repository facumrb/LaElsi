export interface IApiPhoto {
  id: number;
  fileName: string; // Ej: "a1b2-c3d4.jpg" (Lo que guardaste con UUID)
  originalName: string; // Ej: "foto_playa.jpg"
  mimeType: string; // Ej: "image/jpeg"
  productId?: number; // Opcional, por si alguna vez se necesita saber el ID del padre
}
