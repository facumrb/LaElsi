import { Component, model, signal, input, computed } from '@angular/core';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FilterButtonComponent } from '@shared/components/buttons/filter-button/filter-button.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { StockFilter, StatusFilter } from '../../products-toolbar.component';
import { IApiCategory } from '@models/category.model';

@Component({
  selector: 'app-products-filter-button',
  imports: [ClickOutsideDirective, FilterButtonComponent, NgIconComponent],
  viewProviders: [provideIcons({ bootstrapChevronDown, bootstrapCheckLg })],
  templateUrl: './products-filter-button.component.html',
})
export class ProductsFilterButtonComponent {
  statusFilter = model.required<StatusFilter>();
  stockFilter = model.required<StockFilter>();
  categoryFilter = model.required<number | 'Todos'>();
  categories = input.required<IApiCategory[]>();

  showFilterMenu = signal(false);
  showCategoryMenu = signal(false);

  // Computada para categorías en formato árbol plano hasta 3 niveles
  hierarchicalCategories = computed(() => {
    const allCats = this.categories();
    const flatTree: (IApiCategory & { depth: number })[] = [];

    const recurse = (parentId: number | null, depth: number) => {
      if (depth > 2) return;

      const children = allCats.filter(
        (c) => (c.parentId ?? c.parent?.id ?? null) === parentId,
      );

      children.sort((a, b) => a.order - b.order);

      children.forEach((child) => {
        flatTree.push({ ...child, depth });
        recurse(child.id, depth + 1);
      });
    };

    recurse(null, 0);
    return flatTree;
  });

  selectedCategoryName = computed(() => {
    const selected = this.categoryFilter();
    if (selected === 'Todos') {
      return 'Todas las categorías';
    }
    const cat = this.categories().find((c) => c.id === selected);
    return cat ? cat.name : 'Categoría desconocida';
  });

  selectCategory(val: number | 'Todos') {
    this.categoryFilter.set(val);
    this.showCategoryMenu.set(false);
  }

  hayFiltrosActivos() {
    return (
      this.statusFilter() !== 'Todos' ||
      this.stockFilter() !== 'Todos' ||
      this.categoryFilter() !== 'Todos'
    );
  }

  limpiar() {
    this.statusFilter.set('Todos');
    this.stockFilter.set('Todos');
    this.categoryFilter.set('Todos');
    this.showFilterMenu.set(false);
  }
}
