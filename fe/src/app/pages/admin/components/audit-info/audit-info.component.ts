import { Component, input } from '@angular/core';

@Component({
  selector: 'app-audit-info',
  imports: [],
  templateUrl: './audit-info.component.html',
})
export class AuditInfoComponent {
  createdAt = input.required<string | null>();
  updatedAt = input.required<string | null>();

  // Signals para manejar el estado Activo o Inactivo y su fecha
  isActive = input.required<boolean | null>();
  statusDate = input.required<string | null>();
}
