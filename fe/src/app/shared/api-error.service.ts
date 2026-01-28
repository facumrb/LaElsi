import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertService } from './alert.service'; // Tu servicio de alertas

@Injectable({
  providedIn: 'root',
})
export class ApiErrorService {
  // Inyectamos tu AlertService para mostrar los carteles
  private _alertService = inject(AlertService);

  handle(err: HttpErrorResponse, accion: string = 'procesar la solicitud') {
    let titulo = 'Error';
    let mensaje = `Ocurrió un problema al intentar ${accion}.`;

    // 1. Si el Backend nos mandó un mensaje específico (ej: "Ya existe..."), lo usamos.
    if (err.error && err.error.message) {
      mensaje = err.error.message;
    }

    // 2. Personalización según Código de Estado HTTP
    switch (err.status) {
      case 400:
        titulo = 'Datos Inválidos';
        // Si no vino mensaje del back, ponemos uno genérico
        if (!err.error?.message) mensaje = 'Revisa los datos del formulario.';
        break;

      case 401:
        titulo = 'Sesión Expirada';
        mensaje = 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.';
        // Aquí podrías incluso redirigir al login automáticamente
        break;

      case 403:
        titulo = 'Acceso Denegado';
        mensaje = 'No tienes permisos para realizar esta acción.';
        break;

      case 404:
        titulo = 'No Encontrado';
        mensaje = 'El recurso que buscas ya no existe.';
        break;

      case 409:
        titulo = 'Conflicto';
        // Ideal para duplicados (Unique Key)
        if (!err.error?.message)
          mensaje = 'Ya existe un registro con esos datos.';
        break;

      case 500:
        titulo = 'Error del Servidor';
        mensaje = 'Hubo un fallo interno en el servidor. Intenta más tarde.';
        break;
    }

    this._alertService.error(titulo, mensaje);
  }
}
