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

  recoverPassword() {
    return Swal.fire({
      title: 'Recuperación de Contraseña',
      width: '600px',
      html: `
        <div style="text-align: left; font-size: 0.95rem; line-height: 1.5;">
          <p>Por el momento, esta funcionalidad requiere asistencia manual.</p>
          <br>
          <p>Por favor, contactanos por WhatsApp indicando tu <b>nombre de usuario</b> o <b>email</b>.</p>
          <div style="margin-top: 15px; text-align: center;">
            <a href="https://wa.me/5493417121860?text=Hola,%20necesito%20recuperar%20mi%20contraseña%20en%20Laelsi"
               target="_blank"
               style="display: inline-flex; align-items: center; gap: 8px; background-color: #25D366; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">

               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                 <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z"/>
               </svg>

               Enviar mensaje (+54 9 341 712-1860)
            </a>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#6c757d',
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: '!rounded-3xl',
        closeButton:
          '!w-10 !h-10 !rounded-full !bg-white !border !border-gray-200 !flex !shrink-0 !items-center !justify-center !text-gray-500 hover:!text-gray-900 hover:!bg-gray-100 !transition-colors !shadow-sm focus:!outline-none focus:!ring-2 focus:!ring-[#3d4494] !absolute !top-4 !right-4 !mt-0 !mr-0',
      },
      closeButtonHtml: `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      `,
    });
  }
}
