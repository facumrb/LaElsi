import { Injectable } from '@angular/core';
import type { SweetAlertIcon } from 'sweetalert2';

// sweetalert2 se carga bajo demanda: queda fuera del bundle inicial (~79 kB)
// y solo se descarga la primera vez que se muestra una alerta.
const cargarSwal = () => import('sweetalert2').then((m) => m.default);

@Injectable({ providedIn: 'root' })
export class AlertService {
  async toast(title: string, icon: SweetAlertIcon = 'success', text?: string) {
    const Swal = await cargarSwal();
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
  async modal(title: string, html: string, icon: SweetAlertIcon = 'info') {
    const Swal = await cargarSwal();
    return Swal.fire({
      title,
      html,
      icon,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#16a34a',
    });
  }

  async confirmDelete(message: string = 'No podrás revertir esto'): Promise<boolean> {
    const Swal = await cargarSwal();
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

  async confirmAction(
    title: string,
    message: string,
    confirmButtonText: string = 'Sí, confirmar',
  ): Promise<boolean> {
    const Swal = await cargarSwal();
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
}
