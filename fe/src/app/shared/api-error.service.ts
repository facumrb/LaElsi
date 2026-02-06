import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertService } from './alert.service'; // Tu servicio de alertas

@Injectable({
  providedIn: 'root',
})
export class ApiErrorService {
  private _alertService = inject(AlertService);

  handle(err: HttpErrorResponse, accion: string = 'procesar la solicitud') {
    let titulo = 'Error';
    let mensaje = `Ocurrió un problema al intentar ${accion}.`;
    let esCritico = false; // Flag para decidir si usar Modal o Toast

    // Con esto obtenermos el mensaje que haya enviado el backend, si es que hay uno.
    const backendMessage = err.error?.message;
    if (backendMessage) {
      mensaje = backendMessage;
    }

    switch (err.status) {
      case 400:
        titulo = 'Datos Inválidos';
        if (!backendMessage) mensaje = 'Revisa los datos del formulario.';
        break;

      case 401:
        if (backendMessage) {
          // Login fallido (Credenciales incorrectas) -> Toast
          titulo = 'Acceso No Autorizado';
        } else {
          // Token vencido -> Modal
          titulo = 'Sesión Expirada';
          mensaje =
            'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.';
          esCritico = true;
        }
        break;

      case 403:
        titulo = 'Acceso Denegado';
        if (!backendMessage)
          mensaje = 'No tienes permisos para realizar esta acción.';
        break;

      case 404:
        titulo = 'No Encontrado';
        if (!backendMessage) mensaje = 'El recurso que buscas ya no existe.';
        break;

      case 409:
        titulo = 'Conflicto';
        if (!backendMessage) mensaje = 'Ya existe un registro con esos datos.';
        break;

      case 500:
        titulo = 'Error del Servidor';
        mensaje = 'Hubo un fallo interno en el servidor. Intenta más tarde.';
        break;

      case 0:
        // Sin internet o servidor caído -> Modal
        titulo = 'Error de Conexión';
        mensaje = 'No se pudo conectar con el servidor. Verifica tu internet.';
        esCritico = true;
        break;
    }

    if (esCritico) {
      this._alertService.modal(titulo, mensaje, 'warning');
    } else {
      this._alertService.error(titulo, mensaje);
    }
  }
}
