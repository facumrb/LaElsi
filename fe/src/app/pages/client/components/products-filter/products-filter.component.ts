import { Component, model, signal, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapSearch,
  bootstrapX,
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';

// Tipados (los mantengo igual, están bien definidos)
export type PriceOrder = 'Defecto' | 'Menor' | 'Mayor';
export type PopularityOrder = 'Defecto' | 'MasVentas' | 'MenosVentas';

@Component({
  selector: 'app-products-filter',
  imports: [FormsModule, ClickOutsideDirective, NgIconComponent, FilterButtonComponent],
  viewProviders: provideIcons({
    bootstrapSearch,
    bootstrapX,
    bootstrapChevronDown,
    bootstrapCheckLg,
  }),
  templateUrl: './products-filter.component.html',
})
export class ProductsFilterComponent {
  // Models para Two-Way Binding con Signals
  priceOrder = model.required<PriceOrder>();
  brandFilter = model.required<string>();
  popularityOrder = model.required<PopularityOrder>();

  // Input para recibir las marcas disponibles
  brands = input<string[]>([]);

  // UI State
  showFilterMenu = signal(false);
  showBrandMenu = signal(false);

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
    this.showBrandMenu.set(false);
  }

  selectBrand(brand: string) {
    this.brandFilter.set(brand);
    this.showBrandMenu.set(false);
  }

  // Métodos helper para conversión de tipos en el template
  setPriceOrder(value: string) {
    this.priceOrder.set(value as PriceOrder);
  }

  setPopularityOrder(value: string) {
    this.popularityOrder.set(value as PopularityOrder);
  }
}
