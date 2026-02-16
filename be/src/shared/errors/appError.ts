export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Mantener la cadena de prototipos correcta
    Object.setPrototypeOf(this, new.target.prototype);

    // Capturar la traza de la pila
    Error.captureStackTrace(this);
  }
}
