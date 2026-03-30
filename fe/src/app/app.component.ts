import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationHistoryService } from '@services/navigation-history.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  // Se inyecta el servicio para almacenar el historial del cliente automaticamente al entrar a la web y que funcione correctamente el boton de "Volver"
  private navHistory = inject(NavigationHistoryService);
}
