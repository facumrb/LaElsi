import { Component, input } from '@angular/core';

@Component({
  selector: 'app-audit-info',
  imports: [],
  templateUrl: './audit-info.component.html',
})
export class AuditInfoComponent {
  // Recibimos los valores ya formateados o nulos
  createdAt = input<string | null | undefined>(null);
  updatedAt = input<string | null | undefined>(null);
  deletedAt = input<string | null | undefined>(null);
}
