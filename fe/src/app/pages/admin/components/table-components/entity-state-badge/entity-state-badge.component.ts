import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-entity-state-badge',
  templateUrl: './entity-state-badge.component.html',
})
export class EntityStateBadgeComponent {
  state = input.required<string>();
  mode = input<'table' | 'card'>('table');

  modeClasses = computed(() => {
    let classes = '';

    if (this.mode() === 'card') {
      classes += 'lg:hidden ';
    }

    if (this.state() === 'Activo') {
      classes += 'bg-green-50 text-green-700 border-green-200';
    } else {
      classes += 'bg-red-50 text-red-700 border-red-200';
    }

    return classes;
  });

  dotClasses = computed(() => {
    return this.state() === 'Activo' ? 'bg-green-500' : 'bg-red-500';
  });
}
