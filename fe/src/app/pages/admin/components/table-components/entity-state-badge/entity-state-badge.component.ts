import { Component, input, computed } from '@angular/core';
import { CategoryState } from '@models/category.model';
import { ProductState } from '@models/product.model';

export type EntityState = CategoryState | ProductState;
export type BadgeMode = 'table' | 'card';

@Component({
  selector: 'app-entity-state-badge',
  templateUrl: './entity-state-badge.component.html',
})
export class EntityStateBadgeComponent {
  state = input.required<EntityState>();

  // Modo de visualización. Por defecto 'table'.
  mode = input<BadgeMode>('table');

  isActive = computed(() => this.state() === 'Activo');

  badgeClass = computed(() =>
    this.isActive()
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200',
  );

  // Clase de color del punto indicador según el estado de la entidad.
  dotClass = computed(() => (this.isActive() ? 'bg-green-500' : 'bg-red-500'));
}
