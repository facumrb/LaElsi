// Solicitud de arrepentimiento (botón de arrepentimiento, Res. 424/2020 de la Secretaría de Comercio Interior)
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
