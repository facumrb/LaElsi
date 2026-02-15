import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertService } from './alert.service';
import { AuthService } from '@services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApiErrorService {
  private _alertService = inject(AlertService);
  private _authService = inject(AuthService);

  handle(err: HttpErrorResponse, accion: string = 'procesar la solicitud') {
    let titulo = 'Error';
    let mensaje = `Ocurrió un problema al intentar ${accion}.`;
    let esCritico = false;

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
        if (backendMessage && !accion.includes('iniciar sesión')) {
          // Si hay un mensaje del backend y NO estamos intentando loguearnos,
          // significa que el token es inválido o fue rechazado -> Logout forzado
          this._authService.logout();
          titulo = 'Sesión Inválida';
          mensaje = 'Tu sesión ya no es válida. Por favor, ingresa de nuevo.';
          esCritico = true;
        } else if (backendMessage) {
          // Si estamos en la pantalla de login y falla -> Solo mostramos error
          titulo = 'Acceso No Autorizado';
        } else {
          // Token vencido o ausencia de token -> Logout y aviso modal
          this._authService.logout();
          titulo = 'Sesión Expirada';
          mensaje = 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.';
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
