import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  toast(title: string, icon: SweetAlertIcon = 'success', text?: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      icon: icon,
      title: title,
      text: text, // Texto secundario opcional
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  }

  error(title: string, message: string) {
    this.toast(title, 'error', message);
  }

  success(title: string, message?: string) {
    this.toast(title, 'success', message);
  }

  //Modal util para mensajes como "Sesión Expirada" o "Error de Red Crítico".
  modal(title: string, html: string, icon: SweetAlertIcon = 'info') {
    return Swal.fire({
      title,
      html,
      icon,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#16a34a',
    });
  }

  confirmDelete(message: string = 'No podrás revertir esto'): Promise<boolean> {
    return Swal.fire({
      title: '¿Estás seguro?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => result.isConfirmed);
  }

  confirmAction(
    title: string,
    message: string,
    confirmButtonText: string = 'Sí, confirmar',
  ): Promise<boolean> {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancelar',
    }).then((result) => result.isConfirmed);
  }

  confirmEntityDelete(
    entityName: string,
    entityType: 'producto' | 'categoría' | 'cliente' | 'administrador',
    canDeactivate: boolean = true
  ): Promise<'delete' | 'deactivate' | 'cancel'> {
    return Swal.fire({
      title: `<span class="text-lg font-bold text-red-600 font-sans">🚨 ¡Advertencia de Eliminación Definitiva!</span>`,
      html: `
        <div class="text-left text-sm text-gray-700 space-y-3 leading-relaxed font-sans mt-2">
          <p>Estás intentando eliminar el/la ${entityType}: <strong class="text-gray-900 font-semibold">"${entityName}"</strong> de forma permanente.</p>
          
          <div class="p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-950 text-xs">
            <span class="font-bold block mb-1">Riesgo de pérdida de datos</span>
            La eliminación definitiva borrará el registro de la base de datos de manera permanente. Si este/a ${entityType} está vinculado/a a otros procesos (como ventas, facturas, historial de pedidos, auditorías o estadísticas), su eliminación definitiva podría generar errores en el sistema o inconsistencias en los datos históricos.
          </div>

          <div class="p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-blue-950 text-xs">
            <span class="font-bold block mb-1">Recomendación</span>
            En lugar de eliminar definitivamente, se recomienda realizar una <strong>desactivación</strong> (marcarlo/a como inactivo/a o deshabilitado/a). Esto preservará la integridad del historial de operaciones y evitará fallos imprevistos en el sistema.
          </div>
          
          ${!canDeactivate ? `
          <div class="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 text-xs">
            <strong>Nota:</strong> Este/a ${entityType} no soporta la desactivación directa desde esta sección. Si decides eliminarlo/a, asegúrate de que no tenga operaciones asociadas.
          </div>
          ` : ''}
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: canDeactivate,
      confirmButtonColor: '#d33', // Red for physical delete
      denyButtonColor: '#3085d6',   // Blue for logical deactivation
      cancelButtonColor: '#6e7881', // Gray for cancel
      confirmButtonText: 'Eliminar físicamente',
      denyButtonText: 'Desactivar (Recomendado)',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        return 'delete';
      } else if (result.isDenied) {
        return 'deactivate';
      } else {
        return 'cancel';
      }
    });
  }
}

