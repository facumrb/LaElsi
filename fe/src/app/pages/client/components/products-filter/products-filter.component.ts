import { Component, model, signal, computed, input } from '@angular/core';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';
import {
  FilterAccordionComponent,
  FilterOption,
} from '@shared/components/filter-accordion/filter-accordion.component';

export type PriceOrder = 'Defecto' | 'Menor' | 'Mayor';
export type PopularityOrder = 'Defecto' | 'MasVentas' | 'MenosVentas';

@Component({
  selector: 'app-products-filter',
  imports: [
    ClickOutsideDirective,
    FilterButtonComponent,
    FilterAccordionComponent,
  ],
  templateUrl: './products-filter.component.html',
})
export class ProductsFilterComponent {
  priceOrder = model.required<PriceOrder>();
  brandFilter = model.required<string>();
  popularityOrder = model.required<PopularityOrder>();

  // Input para recibir las marcas disponibles
  brands = input<string[]>([]);

  // UI State
  showFilterMenu = signal(false);

  readonly priceOptions: FilterOption[] = [
    { value: 'Defecto', label: 'Por defecto' },
    { value: 'Menor', label: 'Menor a mayor' },
    { value: 'Mayor', label: 'Mayor a menor' },
  ];

  readonly popularityOptions: FilterOption[] = [
    { value: 'Defecto', label: 'Por defecto' },
    { value: 'MasVentas', label: 'Más vendidos' },
    { value: 'MenosVentas', label: 'Menos vendidos' },
  ];

  /** Opciones de marca generadas dinámicamente */
  brandOptions = computed<FilterOption[]>(() => {
    const opts: FilterOption[] = [
      { value: 'Todas', label: 'Todas las marcas' },
    ];
    for (const brand of this.brands()) {
      opts.push({ value: brand, label: brand });
    }
    return opts;
  });

  isAnyFilterActive = computed(() => {
    return (
      this.priceOrder() !== 'Defecto' ||
      this.brandFilter() !== 'Todas' ||
      this.popularityOrder() !== 'Defecto'
    );
  });

  limpiar() {
    this.priceOrder.set('Defecto');
    this.brandFilter.set('Todas');
    this.popularityOrder.set('Defecto');
    this.showFilterMenu.set(false);
  }
}
