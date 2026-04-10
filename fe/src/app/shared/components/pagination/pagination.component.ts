import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronLeft,
  bootstrapChevronRight,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-pagination',
  imports: [NgIconComponent],
  templateUrl: './pagination.component.html',
  viewProviders: [
    provideIcons({
      bootstrapChevronLeft,
      bootstrapChevronRight,
    }),
  ],
})
export class PaginationComponent {
  private el = inject(ElementRef);

  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxVisible = 6; // Define cuántos botones se muestran (sin contar < y >)

    // Si el total de páginas es menor o igual al máximo visible, mostramos todas
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Calculamos el inicio intentando dejar la página actual en el centro
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    // Si el final calculado supera el total de páginas, ajustamos hacia atrás
    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  onPageChange(page: number) {
    if (page === this.currentPage() || page < 1 || page > this.totalPages()) {
      return;
    }

    const scrollTarget =
      this.findScrollableParent(this.el.nativeElement) ?? window;
    const scrollPos =
      scrollTarget instanceof Window
        ? scrollTarget.scrollY
        : scrollTarget.scrollTop;

    if (scrollPos > 0) {
      scrollTarget.addEventListener(
        'scrollend',
        () => this.pageChange.emit(page),
        { once: true },
      );
      scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.pageChange.emit(page);
    }
  }

  private findScrollableParent(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      const overflow = style.overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }
}
