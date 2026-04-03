import { Component, input, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IApiCategory } from '@models/category.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronDown,
  bootstrapCheckLg,
} from '@ng-icons/bootstrap-icons';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { FieldErrorComponent } from '@shared/validators/field-error/field-error.component';

@Component({
  selector: 'app-category-parent-select',
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
    }),
  ],
  templateUrl: './category-parent-select.component.html',
})
export class CategoryParentSelectComponent {
  control = input.required<FormControl<number | null>>();
  categories = input.required<IApiCategory[]>();
  currentCategoryId = input<number | null>(null);
  currentParentId = input.required<number | null>();

  showParentMenu = signal(false);

  // Computada para categorías que pueden ser padres (en formato árbol plano)
  eligibleParents = computed(() => {
    const currentId = this.currentCategoryId();
    const allCats = this.categories();

    let validCats = allCats;
    if (currentId) {
      // Función recursiva para obtener todos los descendientes
      const getDescendantIds = (catId: number): number[] => {
        const children = allCats.filter(
          (c) => (c.parentId ?? c.parent?.id ?? null) === catId,
        );
        let ids = children.map((c) => c.id);
        children.forEach((c) => {
          ids = [...ids, ...getDescendantIds(c.id)];
        });
        return ids;
      };

      const descendants = getDescendantIds(currentId);
      validCats = allCats.filter(
        (c) => c.id !== currentId && !descendants.includes(c.id),
      );
    }

    // Ahora construimos el listado "jerarquizado" ordenado por Categorías y Subcategorías
    const flatTree: IApiCategory[] = [];

    const recurse = (parentId: number | null, depth: number) => {
      // Bloqueamos el renderizado de categorías que alcancen el "Subnivel 2" (depth 2)
      // Porque no queremos que el usuario pueda crearles subcategorías hijas (nivel 3)
      if (depth >= 2) return;

      // Encontrar a los hijos directos de este parent
      const children = validCats.filter(
        (c) => (c.parentId ?? c.parent?.id ?? null) === parentId,
      );

      // Opcional: ordenarlos por 'order' si existe
      children.sort((a, b) => a.order - b.order);

      children.forEach((child) => {
        // Asignamos una copia con el depth explícito para la UI
        flatTree.push({ ...child, depth });
        // Llamada recursiva para los hijos de este hijo
        recurse(child.id, depth + 1);
      });
    };

    recurse(null, 0); // Comenzamos con las categorías raíz
    return flatTree;
  });

  // Nombre del padre seleccionado
  parentName = computed(() => {
    const parentId = this.currentParentId();
    if (!parentId) return 'Ninguna (Categoría Raíz)';
    const parent = this.categories().find((c) => c.id === parentId);
    return parent ? parent.name : 'Ninguna (Categoría Raíz)';
  });

  toggleParentMenu() {
    this.showParentMenu.update((v) => !v);
  }

  selectParent(id: number | null) {
    this.control().setValue(id);
    this.showParentMenu.set(false);
  }
}
