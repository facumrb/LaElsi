import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  // Método para confirmar borrado
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

  // Método para mostrar éxito
  success(title: string, text?: string) {
    Swal.fire({
      title,
      text,
      icon: 'success',
      timer: 1000,
      showConfirmButton: false,
    });
  }

  toast(title: string, icon: SweetAlertIcon = 'success') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000, // Se va a los 3 segundos
      icon: icon,
      title: title,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  }

  // Método para mostrar error
  error(title: string, message: string) {
    Swal.fire({
      title: title,
      html: message.replace(/\n/g, '<br>'),
      icon: 'error',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#d33',
    });
  }
}
