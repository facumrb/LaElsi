// Solicitud de arrepentimiento (botón de arrepentimiento, Disp. 954/2025 de la Subsecretaría de Defensa del Consumidor y Lealtad Comercial)
export interface ICreateRevocation {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  orderNumber: number | null;
  details: string;
}

// Lo que responde el servidor: el código de identificación de la solicitud (ej: ARR-000123)
export interface IRevocationReceipt {
  code: string;
}
