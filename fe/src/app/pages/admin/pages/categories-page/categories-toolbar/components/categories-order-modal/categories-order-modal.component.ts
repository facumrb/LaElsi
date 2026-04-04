import {
  Component,
  effect,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ApiCategoryService } from '@services/api-services/api-category.service';
import { AlertService } from '@services/alert.service';
import { IApiCategory } from '@models/category.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapChevronDown } from '@ng-icons/bootstrap-icons';
import { CloseModalButtonComponent } from '@shared/components/buttons/close-modal-button/close-modal-button.component';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-categories-order-modal',
  imports: [
    DragDropModule,
    NgIconComponent,
    CloseModalButtonComponent,
    ClickOutsideDirective,
  ],
  providers: [provideIcons({ bootstrapChevronDown })],
  templateUrl: './categories-order-modal.component.html',
})
export class CategoriesOrderModalComponent {
  isOpen = model.required<boolean>();
  onSaved = output<void>();

  private apiService = inject(ApiCategoryService);
  private alertService = inject(AlertService);

  categories = signal<IApiCategory[]>([]);
  expandedMap = signal<Record<number, boolean>>({});
  isLoading = signal(false);
  isSaving = signal(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.loadCategories();
      }
    });
  }

  close() {
    this.isOpen.set(false);
  }

  loadCategories() {
    this.isLoading.set(true);
    // Obtenemos jerárquicamente el árbol de categorías (la profundidad máxima permitida viene manejada por el backend)
    this.apiService.getCategoryTree().subscribe({
      next: (data) => {
        // Por defecto el servicio devuelve todas las categorías (Activas o Inactivas) previniendo que ninguna se pierda durante el reordenamiento.
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  toggleExpand(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const current = this.expandedMap();
    this.expandedMap.set({ ...current, [id]: !current[id] });
  }

  drop(event: CdkDragDrop<IApiCategory[]>, list: IApiCategory[]) {
    // Intercambia posicionalmente la categoría arrastrada asegurando que se quede dentro de su nivel de origen
    moveItemInArray(list, event.previousIndex, event.currentIndex);
  }

  save() {
    this.isSaving.set(true);

    const updates: { id: number; order: number; parentId: number | null }[] =
      [];

    const traverse = (list: IApiCategory[], parentId: number | null) => {
      list.forEach((cat, index) => {
        updates.push({
          id: cat.id,
          order: index + 1,
          parentId: parentId,
        });
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children, cat.id);
        }
      });
    };

    traverse(this.categories(), null);

    this.apiService.updateCategoryOrders(updates).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.alertService.toast('Órdenes guardados correctamente', 'success');
        this.onSaved.emit();
        this.close();
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }
}
