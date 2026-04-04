import { Component, input, computed, signal, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IApiCategory } from '@models/category.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronDown,
  bootstrapCheckLg,
  bootstrapPlusLg,
} from '@ng-icons/bootstrap-icons';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';

@Component({
  selector: 'app-product-category-select',
  imports: [
    ReactiveFormsModule,
    ClickOutsideDirective,
    NgIconComponent,
    FieldErrorComponent,
  ],
  viewProviders: [
    provideIcons({
      bootstrapChevronDown,
      bootstrapCheckLg,
      bootstrapPlusLg,
    }),
  ],
  templateUrl: './product-category-select.component.html',
})
export class ProductCategorySelectComponent {
  control = input.required<FormControl<IApiCategory | null>>();
  categories = input.required<IApiCategory[]>();
  
  createCategory = output<void>();

  showCategoryMenu = signal(false);

  // Computada para categorías en formato árbol plano hasta 3 niveles
  hierarchicalCategories = computed(() => {
    const allCats = this.categories();
    const flatTree: (IApiCategory & { depth: number })[] = [];

    const recurse = (parentId: number | null, depth: number) => {
      // Bloqueamos el renderizado de categorías que alcancen el "Subnivel 4"
      // Niveles: 0 = Nivel 1, 1 = Nivel 2, 2 = Nivel 3.
      if (depth > 2) return;

      // Encontrar a los hijos directos de este parent
      const children = allCats.filter(
        (c) => (c.parentId ?? c.parent?.id ?? null) === parentId,
      );

      // Ordenar por 'order'
      children.sort((a, b) => a.order - b.order);

      children.forEach((child) => {
        flatTree.push({ ...child, depth });
        recurse(child.id, depth + 1);
      });
    };

    recurse(null, 0); // Comenzamos con las categorías raíz
    return flatTree;
  });

  // Nombre de la categoria seleccionada
  get selectedCategoryName() {
    const cat = this.control().value;
    if (!cat) return 'Seleccione una categoría';
    return cat.name;
  }

  toggleMenu() {
    this.showCategoryMenu.update((v) => !v);
  }

  selectCategory(cat: IApiCategory) {
    this.control().setValue(cat);
    this.showCategoryMenu.set(false);
  }
}
