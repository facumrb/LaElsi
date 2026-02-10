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
  modal(title: string, text: string, icon: SweetAlertIcon = 'info') {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3d4494',
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
}
